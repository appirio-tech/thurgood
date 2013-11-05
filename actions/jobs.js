var ObjectID = require('mongodb').ObjectID;
var amqp = require('amqp');
var syslogProducer = require('glossy').Produce;
var glossy = new syslogProducer({ type: 'BSD' });
var request = require('request');
var loggers = require('./loggers')

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
    optional: ['loggerId', 'logger', 'options'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    // If logger name is provided, use it to search for id
    if (!connection.params.loggerId && connection.params.logger) {
      api.mongo.collections.loggerSystems.findOne({ name: connection.params.logger }, { _id:1 }, function(err, logger) {
        if (!err && logger) {
          connection.params.loggerId = new String(logger._id);
          api.mongo.create(api, connection, next, api.mongo.collections.jobs, api.mongo.schema.job);
        } else if (!logger) {
          api.mongo.collections.loggerAccounts.findOne({ name: connection.params.userId, email: connection.params.email }, {}, function(err, account) {
            if(!err && account) {
              var loggerConnection = new api.connection({
                type: 'task',
                remotePort: '0',
                remoteIP: '0',
                rawConnection: {}
              });

              loggerConnection.params = {
                action: "loggersCreate",
                apiVersion: 1,
                name: connection.params.logger,
                loggerAccountId: new String(account._id)
              };

              runLocalAction(api, connection, loggerConnection, next, function(id) {
                connection.params.loggerId = id;
                api.mongo.create(api, connection, next, api.mongo.collections.jobs, api.mongo.schema.job);
              });
            } else if (!account) {
              var accountConnection = new api.connection({
                type: 'task',
                remotePort: '0',
                remoteIP: '0',
                rawConnection: {}
              });

              accountConnection.params = {
                action: "accountsCreate",
                apiVersion: 1,
                username: connection.params.userId,
                email: connection.params.email
              };

              runLocalAction(api, connection, accountConnection, next, function(id) {
                var loggerConnection = new api.connection({
                  type: 'task',
                  remotePort: '0',
                  remoteIP: '0',
                  rawConnection: {}
                });

                loggerConnection.params = {
                  action: "loggersCreate",
                  apiVersion: 1,
                  name: connection.params.logger,
                  loggerAccountId: id
                };

                runLocalAction(api, connection, loggerConnection, next, function(id) {
                  connection.params.loggerId = id;
                  api.mongo.create(api, connection, next, api.mongo.collections.jobs, api.mongo.schema.job);
                });
              });
            } else {
              api.response.error(connection, err);
              next(connection, true);
            }
          });
        } else {
          api.response.error(connection, err);
          next(connection, true);
        }
      });
    } else {
      api.mongo.create(api, connection, next, api.mongo.collections.jobs, api.mongo.schema.job);
    }

    function runLocalAction(api, connection, actionConnection, next, cascadeCreate) {
      var actionProcessor = new api.actionProcessor({connection: actionConnection, callback: function(internalConnection, cont) {
        if (internalConnection.error) {
          api.response.error(connection, internalConnection.error);
          next(connection, true);
        } else {
          cascadeCreate(new String(internalConnection.response.data[0]._id));
        }
      }});
      actionProcessor.processAction();
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
    optional: ['facility', 'severity'],
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

    // Find job's logger
    api.mongo.collections.jobs.findOne(selector, function(err, job) {
      if (!err && job) {
        api.mongo.collections.loggerSystems.findOne({ _id: job.loggerId }, function(err, logger) {
          if (!err && logger) {
            // Send message
            glossy.produce({
              facility: connection.params.facility,
              severity: connection.params.severity || 'info',
              host: logger.syslogHostname + ":" + logger.syslogPort,
              date: new Date(),
              message: connection.params.message
            }, function(syslogMsg){
              api.response.success(connection, syslogMsg);
              next(connection, true);
            });
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
          jobId: doc._id,
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
            api.response.error(connection, "Could not find any available servers. Try again in a few minutes");
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
exports.jobsMessage = {
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