var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;
var amqp = require('amqp');
var syslogProducer = require('glossy').Produce;
var glossy = new syslogProducer({ type: 'BSD' });

exports.action = {
  name: "jobsFetch",
  description: "Returns a list of jobs, or a specific one if id is defined. Method: GET",
  inputs: {
    required: [],
    optional: ['q', 'fields', 'sort', 'limit', 'skip', 'id'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var selector, fields, sort, options = {};

    // If id is defined, override selector
    if (connection.params.id) {
      try {
        selector = { _id: new ObjectID(connection.params.id) };
      } catch(err) {
        connection.rawConnection.responseHttpCode = 400;
        connection.response = {
          success: false,
          message: "Invalid id"
        };

        next(connection, true);
        return;
      }
    } else {
      // Otherwise try to parse selector parameter
      try {
        selector = JSON.parse(connection.params.q);
      } catch(err) {
        selector = {};
      }
    }
    
    // Try to parse fields parameter
    try {
      fields = JSON.parse(connection.params.fields);
    } catch(err) {
      fields = {};
    }
    
    // Try to parse sort parameter
    try {
      sort = JSON.parse(connection.params.sort);
    } catch(err) {
      sort = undefined;
    }

    // Options parameters. Ignore them if id is defined
    if (!connection.params.id) {
      options.limit = connection.params.limit;
      options.skip = connection.params.skip;
      options.sort = sort;
    }

    // Find jobs
    api.mongo.collections.jobs.find(selector, fields, options).toArray(function(err, docs) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 200;
        connection.response = {
          success: true,
          data: docs
        };
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };
      }

      next(connection, true);
    });
  }
};

exports.jobsCreate = {
  name: "jobsCreate",
  description: "Creates a new job. Method: POST",
  inputs: {
    required: [],
    optional: ['status', 'email', 'platform', 'language', 'loggerId', 'userId', 'codeUrl', 'options', 'startTime', 'endTime'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var jobDoc = api.mongo.schema.new(api.mongo.schema.job);

    // Assign parameters
    _.each(jobDoc, function(value, key) {
      if (_.contains(Object.keys(connection.params), key)) {
        // Parse loggerId as ObjectId not string
        if (key == 'loggerId') {
          try {
            jobDoc[key] = new ObjectID(connection.params[key]);
          } catch(err) {
            connection.rawConnection.responseHttpCode = 400;
            connection.response = {
              success: false,
              message: "Invalid loggerId"
            };

            next(connection, true);
            return;
          }
        } else {
          jobDoc[key] = connection.params[key];
        }
      }
    });

    // Insert document
    api.mongo.collections.jobs.insert(jobDoc, { w:1 }, function(err, result) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 201;
        connection.response = {
          success: true,
          message: "Job created successfully",
          data: result
        };
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };
      }

      next(connection, true);
    });
  }
};

exports.jobsMessage = {
  name: "jobsMessage",
  description: "Sends a message to the job's logger. Method: POST",
  inputs: {
    required: ['id', 'message'],
    optional: ['facility', 'severity'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var selector;

    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      connection.rawConnection.responseHttpCode = 400;
      connection.response = {
        success: false,
        message: "Invalid id"
      };

      next(connection, true);
      return;
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
              connection.rawConnection.responseHttpCode = 200;
              connection.response = {
                success: true,
                message: syslogMsg
              };

              next(connection, true);
            });
          } else if (!logger) {
            err = "Logger not found";
            connection.rawConnection.responseHttpCode = 500;
            connection.error = err;
            connection.response = {
              success: false,
              message: err
            };

            next(connection, true);
          } else {
            connection.rawConnection.responseHttpCode = 500;
            connection.error = err;
            connection.response = {
              success: false,
              message: err
            };

            next(connection, true);
          }
        });
      } else if (!job) {
        err = "Job not found";
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };

        next(connection, true);
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };

        next(connection, true);
      }
    });
  }
};

exports.jobsSubmit = {
  name: "jobsSubmit",
  description: "Submits a job. Method: PUT",
  inputs: {
    required: ['id'],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var selector;

    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      connection.rawConnection.responseHttpCode = 400;
      connection.response = {
        success: false,
        message: "Invalid id"
      };

      next(connection, true);
      return;
    }

    api.mongo.collections.jobs.findOne(selector, function(err, doc) {
      if (!err && doc) {
        if (doc.status != "pending") {
          connection.rawConnection.responseHttpCode = 200;
          connection.response = {
            success: true,
            message: "Job already submitted",
            data: doc
          };

          next(connection, true);
        } else {
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

          api.mongo.collections.servers.findAndModify(serverSelector, {}, { $set: newDoc }, { new: true, w:1 }, function(err, server) {
            if (!err && server) {
              var rabbitMq = amqp.createConnection({ url: api.configData.rabbitmq.url });
              var message = {
                job_id: server.jobId,
                type: doc.language
              };

              // Set job status to submitted
              api.mongo.collections.jobs.update({ _id: doc._id }, { $set: { status: 'submitted', updatedAt: new Date().getTime() } }, { w:1 }, function(err, result) {
                if (!err) {
                  // Publish message
                  rabbitMq.on('ready', function () {
                    rabbitMq.publish('thurgood-dev-queue', message);
                    rabbitMq.end();
                  });

                  connection.rawConnection.responseHttpCode = 200;
                  connection.response = {
                    success: true,
                    message: "Job has been successfully submitted"
                  };
                } else {
                  connection.rawConnection.responseHttpCode = 500;
                  connection.error = err;
                  connection.response = {
                    success: true,
                    message: err
                  };
                }

                next(connection, true);
              });
            } else if (!server) {
              err = "Could not find any available servers. Try again in a few minutes";
              connection.rawConnection.responseHttpCode = 500;
              connection.error = err;
              connection.response = {
                success: false,
                message: err
              };

              next(connection, true);
            } else {
              connection.rawConnection.responseHttpCode = 500;
              connection.error = err;
              connection.response = {
                success: false,
                message: err
              };

              next(connection, true);
            }
          });
        }
      } else if (!doc) {
        err = "Job not found"
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };

        next(connection, true);
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };

        next(connection, true);
      }
    });
  }
};

exports.jobsUpdate = {
  name: "jobsUpdate",
  description: "Updates a job. Method: PUT",
  inputs: {
    required: ['id'],
    optional: ['status', 'email', 'platform', 'language', 'papertrailSystem', 'userId', 'codeUrl', 'options', 'startTime', 'endTime'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var selector, jobDoc = {};

    // Create a document with the new values
    _.each(connection.params, function(paramValue, paramKey) {
      if (paramKey != 'id' && _.contains(Object.keys(api.mongo.schema.job), paramKey)) {
        jobDoc[paramKey] = paramValue;
      }
    });

    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      connection.rawConnection.responseHttpCode = 400;
      connection.response = {
        success: false,
        message: "Invalid id"
      };

      next(connection, true);
      return;
    }

    // Update document
    jobDoc.updatedAt = new Date().getTime();
    api.mongo.collections.jobs.findAndModify(selector, {}, { $set: jobDoc }, { new: true, w:1 }, function(err, result) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 200;
        connection.response = {
          success: true,
          message: "Job updated successfully",
          data: result
        };
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };
      }

      next(connection, true);
    });
  }
};
