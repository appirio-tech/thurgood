var ObjectID = require('mongodb').ObjectID;
var amqp = require('amqp');
var request = require('request');
var loggers = require('./loggers');
var crypto = require('crypto');
var accessLevels = require('../public/js/routingConfig').accessLevels;
var syslog = require('syslog');
var _ = require('underscore');
var Q = require("q");
var papertrail = require("../lib/papertrail");

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
  run: function(api, connection, next) {
    var selector;

    // Validate id and build selector
    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      api.response.badRequest(connection, "Id is not a valid ObjectID");
      return next(connection, true);
    }

    var newDoc = {
      status: 'complete',
      endTime: new Date().getTime(),
      updatedAt: new Date().getTime()
    };

    // Modify document
    api.mongo.collections.jobs.findAndModify(selector, {}, { $set: newDoc }, { new: true, w:1 }, function(err, job) {
      if (!err && job) {
        var newDoc = {
          jobId: null,
          status: 'available',
          updatedAt: new Date().getTime()
        };

        // Find server and release it
        api.mongo.collections.servers.findAndModify({ jobId: job._id.toString() }, {}, { $set: newDoc }, { new: true, w:1 }, function(err, server) {
          if (!err) {
            api.response.success(connection, "Job updated and server released");
          } else {
            api.response.error(connection, err);
          }

          next(connection, true);
        });
      } else if (!job) {
        api.response.error(connection, "Job not found");
        next(connection, true);
      } else {
        api.response.error(connection, err);
        next(connection, true);
      }
    });
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
              authorization: "Token token=" + process.env.THIS_API_KEY
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
  run: function(api, connection, next) {
    var selector, loggerSelector;

    // Validate id and build selector
    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      api.response.badRequest(connection, "Id is not a valid ObjectID");
      return next(connection, true);
    }

    // Find job's logger
    api.mongo.collections.jobs.findOne(selector, function(err, job) {
      if (!err && job) {
        loggerSelector = { _id: new ObjectID(job.loggerId) };
        api.mongo.collections.loggerSystems.findOne(loggerSelector, function(err, logger) {
          if (!err && logger) {
            // set some temp - testing vars
            logger.syslogHostname = "logs.papertrailapp.com";
            logger.syslogPort = 37402;

            var logger = syslog.createClient(logger.syslogPort, logger.syslogHostname, {name: connection.params.message.sender});
            logger.info(connection.params.message.text);
            api.response.success(connection, "Message sent to logger.");
            next(connection, true);            
          } else if (!logger) {
            api.response.error(connection, "Logger not found");
            next(connection, true);
          } else {
            api.response.error(connection, err);
            next(connection, true);
          }
        });
      } else if (!job) {
        api.response.error(connection, "Job not found");
        next(connection, true);
      } else {
        api.response.error(connection, err);
        next(connection, true);
      }
    });
  }
};

/**
 * POST /jobs/:id/submit
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
  run: function(api, connection, next) {
    var selector;

    // Validate id and build selector
    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      api.response.badRequest(connection, "Id is not a valid ObjectID");
      return next(connection, true);
    }

    // Find document
    api.mongo.collections.jobs.findOne(selector, function(err, doc) {
      if (!err && doc) {
        // can submit a job no matter the current status
        var serverSelector = {
          languages: doc.language,
          platform: doc.platform,
          status: 'available'
        };

        var newDoc = {
          jobId: doc._id.toString(),
          status: 'reserved',
          updatedAt: new Date().getTime()
        };

        // Find server and reserve it
        api.mongo.collections.servers.findAndModify(serverSelector, {}, { $set: newDoc }, { new: true, w:1 }, function(err, server) {
          if (!err && server) {
            var message = {
              job_id: server.jobId,
              type: doc.language
            };

            var newDoc = {
              status: 'submitted',
              startTime: new Date().getTime(),
              updatedAt: new Date().getTime()
            };

            // Set job status to submitted
            api.mongo.collections.jobs.update({ _id: doc._id }, { $set: newDoc }, { w:1 }, function(err, result) {
              if (!err) {
                // Publish message
                api.configData.rabbitmq.connection.publish(api.configData.rabbitmq.queue, message);
                api.response.success(connection, "Job has been successfully submitted for processing.");
              } else {
                api.response.error(connection, err);
              }

              next(connection, true);
            });
          } else if (!server) {
            api.response.error(connection, "Could not find any available servers. Try again in a few minutes.");
            next(connection, true);
          } else {
            api.response.error(connection, err);
            next(connection, true);
          }
        });
      } else if (!doc) {
        api.response.error(connection, "Job not found");
        next(connection, true);
      } else {
        api.response.error(connection, err);
        next(connection, true);
      }
    });
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
    optional: ['status', 'email', 'platform', 'language', 'papertrailSystem', 'userId', 'codeUrl', 'options', 'steps', 'notification', 'startTime', 'endTime'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
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
  run: function(api, connection, next) {
    api.configData.rabbitmq.connection.publish(api.configData.rabbitmq.queue, connection.params.message);  
    api.response.success(connection, "Message successfully published.");
    next(connection, true);
  }
};