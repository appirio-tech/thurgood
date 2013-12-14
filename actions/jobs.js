var ObjectID = require('mongodb').ObjectID;
var amqp = require('amqp');
var request = require('request');
var loggers = require('./loggers');
var crypto = require('crypto');
var accessLevels = require('../public/js/routingConfig').accessLevels;
var syslog = require('syslog');
var _ = require('underscore');
var Q = require("q");

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
        api.mongo.collections.servers.findAndModify({ jobId: job._id }, {}, { $set: newDoc }, { new: true, w:1 }, function(err, server) {
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
    optional: ['loggerId', 'logger', 'options', 'project'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var promise = null;
    var attrs = _.pick(connection.params, _.keys(api.mongo.schema.job));

    // add the job with the specified loggerId
    if (connection.params.loggerId) {
      promise = api.jobs.create(attrs);

    // add the job with a loggerId that we lookup by logger name
    } else if (connection.params.logger) {
      var loggerName = connection.params.logger;

      promise = api.loggers.findByName(loggerName)
                  .then(createLoggerIfNotExist)
                  .then(createJobFromLogger);
    }
    else {
      promise = createLoggerIfNotExist().then(createJobFromLogger);
    }

    promise.then(respondOk).fail(respondError).done();


    function createJobFromLogger(logger) {
      if(!logger) {
        // make sure that the logger exist before calling this function.
        throw new Exception("Logger does not exist");
      }

      attrs.loggerId = logger._id.toString();
      return api.jobs.create(attrs);      
    }

    function createLoggerIfNotExist(logger) {
      if(logger) { return logger; }

      var name = connection.params.userId;
      var email = connection.params.email;
      return api.loggerAccounts.findByNameAndEmail(name, email)
              .then(createAccountIfNotExist)
              .then(createLoggerFromAccount);
    }

    function createAccountIfNotExist(account) {
      if(account) { return account; }

      // if we didn't find an account, create the account and also the logger
      // NEEDED MODIFICATION -- the account may already exist in papertrail but not in mongo. should check first to see if the 
      // account exists in papertrail, if it does then simply insert the record into the account and create the new logger. if it does
      // not exist in papertrail tehn continue on below and create both the account and logger.

      var deferred = Q.defer();

      var loggerConnection = buildApiConnection("accountsCreate");
      loggerConnection.params.username = connection.params.userId;
      loggerConnection.params.email = connection.params.email;

      runLocalAction(loggerConnection, deferred.makeNodeResolver());

      return deferred.promise;
    }

    function createLoggerFromAccount(account) {
      var deferred = Q.defer();

      var loggerName = connection.params.logger || crypto.randomBytes(16).toString('hex');
      var loggerConnection = buildApiConnection("loggersCreate");
      loggerConnection.params.name = loggerName;
      loggerConnection.params.loggerAccountId = new String(account._id);

      runLocalAction(loggerConnection, deferred.makeNodeResolver());

      return deferred.promise;
    }

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

    function runLocalAction(actionConnection, callback) {
      var actionProcessor = new api.actionProcessor({connection: actionConnection, callback: function(internalConnection, cont) {
        
        var err = internalConnection.error;
        if(err) { return callback(err, null); }

        var item = internalConnection.response.data[0];
        if(callback) { callback(null, item); }
      }});

      actionProcessor.processAction();
    }

    function respondOk(job) {
      api.response.success(connection, null, job);
      next(connection, true);
    }

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
              updatedAt: new Date().getTime()
            };

            // Set job status to submitted
            api.mongo.collections.jobs.update({ _id: doc._id }, { $set: newDoc }, { w:1 }, function(err, result) {
              if (!err) {
                // Publish message
                api.configData.rabbitmq.connection.publish(api.configData.rabbitmq.queue, message);
                api.response.success(connection, "Job has been successfully submitted");
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
    optional: ['status', 'email', 'platform', 'language', 'papertrailSystem', 'userId', 'codeUrl', 'options', 'startTime', 'endTime'],
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