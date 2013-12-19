var Q = require("q");
var _ = require('underscore');

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
    }
  }

  next();
}
