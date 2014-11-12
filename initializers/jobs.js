var Q = require("q");
var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');
var Papertrail = require('winston-papertrail').Papertrail;

/*
  user model, it uses promise.
*/
exports.jobs = function(api, next){

  api.jobs = {

    // creates a job, and returns promise.
    create: function(attrs) {
      var deferred = Q.defer();
      var collection = api.mongo.collections.jobs;
      var doc = api.mongo.schema.new(api.mongo.schema.job);
      _.extend(doc, _.pick(attrs, _.keys(doc)));

      console.log("[Jobs]", "create job", doc);
      collection.insert(doc, {safe: true}, function(err, result) {
        if(err) { return deferred.reject(err); }

        deferred.resolve(doc);
      });

      return deferred.promise;
    },

    findById: function(id) {
      var deferred = Q.defer();

      api.mongo.utils.validateObjectId(id)
        .then(function() {

          api.mongo.collections.jobs.findOne({ _id: new ObjectID(id) }, function(err, job) {
            if (job) {
              deferred.resolve(job);
            } else {
              deferred.reject(new Error("Job not found."));
            }
          });

        })
        .fail(function(err) {
          deferred.reject(err);
        });

      return deferred.promise;
    },

    // releases a server and makes it available
    releaseServer: function(job) {
      var deferred = Q.defer();
      var newDoc = {
        jobId: null,
        status: 'available',
        updatedAt: new Date().getTime()
      };

      api.mongo.collections.servers.findAndModify({ jobId: job._id.toString() }, {}, { $set: newDoc }, { new: true, w:1 }, function(err, server) {
        if (!err && server) {
          deferred.resolve(job);
        } else {
          deferred.reject(err);
        }

        return deferred.promise;
      });
    } ,

    // logs some text to papertrail
    log: function(id, sender, text) {
      var deferred = Q.defer();

      api.mongo.utils.validateObjectId(id)
        .then(function() {

          var selector = { _id: new ObjectID(id) };
          // Find job's logger
          api.mongo.collections.jobs.findOne(selector, function(err, job) {
            if (!err && job) {
              loggerSelector = { _id: new ObjectID(job.loggerId) };
              api.mongo.collections.loggerSystems.findOne(loggerSelector, function(err, logger) {
                if (!err && logger) {

                  var winstonLogger = new winston.Logger({
                      transports: [
                          new Papertrail({
                              host: logs2.papertrailapp.com,
                              port: logger.syslogPort,
                              hostname: logger.papertrailId,
                              program: sender,
                              colorize: true,
                              logFormat: function(level, message) {
                                  return message;
                              }
                          })
                      ]
                  });

                  // send the message to pt
                  winstonLogger.info(text);
                  deferred.resolve("Message sent to logger.");
                } else if (!logger) {
                  deferred.reject(new Error("Logger not found"));
                } else {
                  deferred.reject(err);
                }
              });
            } else if (!job) {
              deferred.reject(new Error("Job not found"));
            } else {
              deferred.reject(err);
            }
          });

        })
        .fail(function(err) {
          deferred.reject(err);
        });
      return deferred.promise;
    }

  };

  next();
};
