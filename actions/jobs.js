var ObjectID = require('mongodb').ObjectID;
var amqp = require('amqplib');
var request = require('request');
var loggers = require('./loggers');
var crypto = require('crypto');
var accessLevels = require('../public/js/routingConfig').accessLevels;
var _ = require('underscore');
var Q = require("q");
var when = require('when');
var papertrail = require("../lib/papertrail");
var mailer = require("../lib/mandrill");

/**
 * GET /jobs
 * GET /jobs/:id
 */
exports.action = {
  name: "jobsFetch",
  description: "Returns a list of jobs, or a specific one if id is defined. Method: GET",
  inputs: {
    required: [],
    optional: ['q', 'fields', 'sort', 'limit', 'skip', 'id'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.user,
  run: function(api, connection, next) {
    api.mongo.get(api, connection, next, api.mongo.collections.jobs);
  }
};

/**
 * GET /jobs/:id/complete
 */
exports.jobsComplete = {
  name: "jobsComplete",
  description: "Sets a job's status as completed. Method: GET",
  inputs: {
    required: ['id'],
    optional: [],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.admin,
  run: function(api, connection, next) {

    api.jobs.findById(connection.params.id)
      .then(api.jobs.releaseServer)
      .then(markJobComplete)
      .then(respondOk)
      .fail(respondError);

    // respond success with the results message
    function markJobComplete(job) {
      var deferred = Q.defer();
      var selector = { _id: new ObjectID(connection.params.id) };
      var newDoc = {
        status: 'complete',
        endTime: new Date().getTime(),
        updatedAt: new Date().getTime()
      };
      var messages = ['have a super-awesome day.','remember to eat your vegetables.', 'do not play the lottery. It is a waste of time. You will not win.','do a kind deed for someone today.', 'remember to spend time with the people you love.', 'get some sleep. You look tired.'];

      api.mongo.collections.jobs.findAndModify(selector, {}, { $set: newDoc }, { new: true, w:1 }, function(err, job) {
        if (!err && job) {
          // send the job complete notifications email if requested
          if (job.notification === "email") {
            mailer.sendMail(api, job);
          }
          // write message to pt that job is compete
          api.jobs.log(connection.params.id, "thurgood", "Job complete. Thank you and " + messages[Math.floor((Math.random()*5))]);
          deferred.resolve(job);
        } else {
          deferred.reject(err);
        }
      });

      return deferred.promise;
    }

    // respond success with the results message
    function respondOk(result) {
      api.response.success(connection, null, "Job updated and server released");
      next(connection, true);
    }

    // respond error
    function respondError(err) {
      api.response.error(connection, err.message);
      next(connection, true);
    }
  }
};

/**
 * POST /jobs
 */
exports.jobsCreate = {
  name: "jobsCreate",
  description: "Creates a new job. Method: POST",
  inputs: {
    required: ['email', 'platform', 'language', 'userId', 'codeUrl'],
    optional: ['loggerId', 'logger', 'options', 'project', 'notification', 'steps'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.user,
  run: function(api, connection, next) {
    var promise = null;
    var attrs = _.pick(connection.params, _.keys(api.mongo.schema.job));

    if (connection.params.loggerId) {
      // create a job with the specified loggerId
      promise = api.jobs.create(attrs);

    } else if (connection.params.logger) {
      // 1. find logger from name
      // 2. if not exist create a logger with the name
      // 3. create a job from the created/found logger.
      var loggerName = connection.params.logger;
      promise = api.loggers.findByName(loggerName)
                  .then(createLoggerIfNotExist)
                  .then(createJobFromLogger);
    }
    else {
      // 1. create a logger with random generated name
      // 2. create a job from the created logger
      promise = createLoggerIfNotExist().then(createJobFromLogger);
    }

    // respond error or success.
    promise.then(respondOk).fail(respondError).done();


    //
    // Help functions from here
    //

    // create a job from a logger
    function createJobFromLogger(logger) {
      if(!logger) {
        // make sure that the logger exist before calling this function.
        throw new Exception("Internal Error - Logger does not exist");
      }

      attrs.loggerId = logger._id.toString();
      return api.jobs.create(attrs);
    }

    // create a account if not exist
    function createLoggerIfNotExist(logger) {
      if(logger) { return logger; }

      console.log("[jobsCreate]", "Create a logger");
      // 1. find a account by name and email
      // 2. if not exist, create an account with the name ane email
      // 3. create a logger from the found/created account
      var name = connection.params.userId;
      var email = connection.params.email;
      return api.loggerAccounts.findByNameAndEmail(name, email)
              .then(createAccountIfNotExist)
              .then(createLoggerFromAccount);
    }

    // create a account if not exist
    function createAccountIfNotExist(account) {
      if(account) { return account; }

      console.log("[jobsCreate]", "Create an account");

      var deferred = Q.defer();

      // 1. first check if the account exist in papertrail.
      papertrail.findAccount(api, connection.params.userId).then(function(account) {
        if(account) {
          // 2.1 if exist, just insert an account to the db.
          console.log("[jobsCreate]", "found an account in papertrail");

          var attrs = {
            email: connection.params.email,
            name: account.name,
            papertrailApiToken: account.api_token,
            papertrailId: account.id
          };

          api.loggerAccounts.create(attrs).then(function(account) {
            deferred.resolve(account);
          }, deferred.reject);
        }
        else {
          // 2.2 if not exist, create in both papertrail and db using local action process.
          var localConnection = buildApiConnection("accountsCreate");
          localConnection.params.username = connection.params.userId;
          localConnection.params.email = connection.params.email;

          runLocalAction(localConnection, deferred.makeNodeResolver());
        }
      }).fail(function(err) {
        console.log("[jobsCreate]", "Error connecting to Papertrail. Check that PAPERTRAIL_DIST_USERNAME and PAPERTRAIL_DIST_PASSWORD are correct");
        deferred.reject(new Error("Could not create job for processing. Please contact support"));
      });

      return deferred.promise;
    }

    // creates a logger of account.
    // it uses local action process.
    // returns promise.
    function createLoggerFromAccount(account) {
      if(!account) {
        // make sure that the accout exists before calling this function.
        throw new Exception("Internal Error - Account does not exist");
      }

      console.log("[jobsCreate]", "Create a logger with account", account.name);

      var deferred = Q.defer();

      var loggerName = connection.params.logger || crypto.randomBytes(16).toString('hex');
      var localConnection = buildApiConnection("loggersCreate");
      localConnection.params.name = loggerName;
      localConnection.params.loggerAccountId = account._id.toString();

      runLocalAction(localConnection, deferred.makeNodeResolver());

      return deferred.promise;
    }

    // default api connection.
    // used when run action process locally(see runLocalAction below)
    function buildApiConnection(action) {
      var connection = new api.connection({
        type: 'task',
        remotePort: '0',
        remoteIP: '0',
        rawConnection: {
          req: {
            headers: {
              authorization: "Token token=" + api.configData.general.apiKey
            }
          }
        }
      });

      connection.params = {
        action: action,
        apiVersion: 1
      }

      return connection;
    }

    // run a action process locally
    //  - to create a logger or
    //  - to create a loggerAccount.
    // callback is like `function (err, createdItem) {}`
    function runLocalAction(actionConnection, callback) {
      console.log("[jobsCreate]", "run local action :", actionConnection.params.action);
      var actionProcessor = new api.actionProcessor({connection: actionConnection, callback: function(internalConnection, cont) {

        var err = internalConnection.error;
        if(err) { return callback(err, null); }
        var item = internalConnection.response.data[0];
        console.log("[jobsCreate]", " => local action result :", item);
        if(callback) { callback(null, item); }
      }});

      actionProcessor.processAction();
    }

    // respond success with the created job.
    function respondOk(job) {
      api.response.success(connection, null, job);
      next(connection, true);
    }

    // respond error
    function respondError(err) {
      console.log("[jobsCreate] Error : ", err.stack);
      api.response.error(connection, err);
      next(connection, true);
    }
  }
};

/**
 * POST /jobs/:id/message
 */
exports.jobsMessage = {
  name: "jobsMessage",
  description: "Sends a message to the job's logger. Method: POST",
  inputs: {
    required: ['id', 'message'],
    optional: [],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.user,
  run: function(api, connection, next) {
    api.jobs.log(connection.params.id, connection.params.message.sender, connection.params.message.text)
      .then(function(results) {
        api.response.success(connection, null, results);
        next(connection, true);
      })
      .fail(function(err) {
        console.log("[FATAL] Could not send message to logger for job " + connection.params.id);
        api.response.error(connection, err.message);
        next(connection, true);
      });
  }
};

/**
 * PUT /jobs/:id/submit
 */
exports.jobsSubmit = {
  name: "jobsSubmit",
  description: "Submits a job. Method: PUT",
  inputs: {
    required: ['id'],
    optional: [],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.user,
  run: function(api, connection, next) {

    api.jobs.findById(connection.params.id)
      .then(reserveServer)
      .then(updateJobAndPublish)
      .then(respondOk)
      .fail(respondError);

    function reserveServer(job) {
      var deferred = Q.defer();
      var  serverNotFoudMsg = "Could not find any available servers. Try again in a few minutes.";
      var selector = {
        languages: job.language.toLowerCase(),
        platform: job.platform.toLowerCase(),
        project: null,
        status: 'available'
      };
      // change the status to reserved
      var newDoc = {
        jobId: job._id.toString(),
        status: 'reserved',
        updatedAt: new Date().getTime()
      };

      // if this job is not for a project but is scan only then find available "checkmarx-scan-only" server
      if (job.steps === "scan" && !job.project) {
        selector.name = api.configData.general.scanOnlyProjectName;
        delete selector.languages;
        delete selector.platform;
        delete selector.project;
      }

      // if we are building for a specific project look for a matching server by project name
      if (job.project) {
        selector.project = job.project;
      }

      // Find server and reserve it
      api.mongo.collections.servers.findAndModify(selector, {}, { $set: newDoc }, { new: true, w:1 }, function(err, server) {
        if (!err) {
          // if we found a matching server return it
          if (server) {
            deferred.resolve(job);

          // if no server found but looking for a matching project,
          // then remove the project attribute and just look for a matching language/platform
          } else if (!server && job.project) {
            // remove the project selector attribute
            selector.project = null;
            api.mongo.collections.servers.findAndModify(selector, {}, { $set: newDoc }, { new: true, w:1 }, function(err, server) {
              if (!err && server) {
                deferred.resolve(job);
              } else {
                deferred.reject(new Error(serverNotFoudMsg));
              }
            });
          // no server found and not for a specific project
          } else {
            deferred.reject(new Error(serverNotFoudMsg));
          }
        // error occurred
        } else {
          deferred.reject(new Error(serverNotFoudMsg));
        }
      });
      return deferred.promise;
    }

    function updateJobAndPublish(job) {
      var deferred = Q.defer();
      var message = {
        job_id: job._id,
        type: job.language
      };
      var newDoc = {
        status: 'submitted',
        startTime: new Date().getTime(),
        endTime: null,
        updatedAt: new Date().getTime()
      };

      // Set job status to submitted
      api.mongo.collections.jobs.update({ _id: job._id }, { $set: newDoc }, { w:1 }, function(err, result) {
        if (!err && result == 1) {
          // Publish message
          amqp.connect(api.configData.rabbitmq.url ).then(function(conn) {
            return when(conn.createChannel().then(function(ch) {
              var ok = ch.assertQueue(api.configData.rabbitmq.queue, {durable: false});
              return ok.then(function(_qok) {
                ch.sendToQueue(api.configData.rabbitmq.queue, new Buffer(JSON.stringify(message)));
                console.log(" [x] Sent '%s'", JSON.stringify(message));
                deferred.resolve("Job has been successfully submitted for processing. See the job's Event Viewer for details.");
                return ch.close();
              });
            })).ensure(function() { conn.close(); });;
          }).then(null, console.warn);

        } else {
          api.jobs.releaseServer(job);
          deferred.reject(new Error("Could not update job and publish message for processing. Contact support."));
        }
      });
      return deferred.promise;
    }

    // respond success with the results message
    function respondOk(result) {
      api.jobs.log(connection.params.id, "thurgood", "Job submitted for processing.");
      api.response.success(connection, null, result);
      next(connection, true);
    }

    // respond error
    function respondError(err) {
      console.log("[FATAL] " + err.message + " Job: " + connection.params.id);
      api.jobs.log(connection.params.id, "thurgood", "Error submitting your job for processing: " + err.message);
      api.response.error(connection, err.message);
      next(connection, true);
    }

  }
};

/**
 * PUT /jobs/:id
 */
exports.jobsUpdate = {
  name: "jobsUpdate",
  description: "Updates a job. Method: PUT",
  inputs: {
    required: ['id'],
    optional: ['status', 'email', 'platform', 'language', 'papertrailSystem', 'userId', 'codeUrl', 'options', 'steps', 'notification', 'startTime', 'endTime', 'project'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.user,
  run: function(api, connection, next) {
    // set the project for the job to null if 'null'
    if (connection.params.project === "null") {
      connection.params.project = null;
    }
    api.mongo.update(api, connection, next, api.mongo.collections.jobs, api.mongo.schema.job);
  }
};

/**
 * POST /jobs/:id/publish
 */
exports.jobsPublish = {
  name: "jobsPublish",
  description: "Publishes a message to the queue. Method: POST",
  inputs: {
    required: ['message'],
    optional: [],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.user,
  run: function(api, connection, next) {
    api.configData.rabbitmq.connection.publish(api.configData.rabbitmq.queue, connection.params.message);
    api.response.success(connection, "Message successfully published.");
    next(connection, true);
  }
};
