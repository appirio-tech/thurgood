var Q = require("q");
var _ = require('underscore');

/*
  loggerAccounts model, it uses promise.
*/
exports.loggerAccounts = function(api, next){

  api.loggerAccounts = {

    // creates a job, and returns promise.
    findByNameAndEmail: function(name, email) {
      var deferred = Q.defer();
      var collection = api.mongo.collections.loggerAccounts;

      collection.findOne({name:name, email: email}, deferred.makeNodeResolver());

      return deferred.promise;
    },

    create: function(attrs) {
      var deferred = Q.defer();
      var collection = api.mongo.collections.loggerAccounts;
      var doc = api.mongo.schema.new(api.mongo.schema.loggerAccount);
      _.extend(doc, _.pick(attrs, _.keys(doc)));

      console.log("[loggerAccounts]", "create a loggerAccount", doc);
      collection.insert(doc, {safe: true}, function(err, result) {
        if(err) { return deferred.reject(err); }

        deferred.resolve(doc);
      });

      return deferred.promise;      
    }
  }

  next();
}
