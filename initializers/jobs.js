var Q = require("q");
var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;

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
      var selector;
      var deferred = Q.defer();

      // Validate id and build selector
      try {
        selector = { _id: new ObjectID(id) };
      } catch(err) {
        deferred.reject(new Error("Id is not a valid ObjectID"));
      }      

      api.mongo.collections.jobs.findOne(selector, function(err, job) {
        if (job) {
          deferred.resolve(job);
        } else {
          deferred.reject(new Error("Job not found."));
        }
      });

      return deferred.promise;    
    }

  }

  next();
}
