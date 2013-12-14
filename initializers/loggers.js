var Q = require("q");
var _ = require('underscore');

/*
  loggers model, it uses promise.
*/
exports.loggers = function(api, next){

  api.loggers = {

    findByName: function(name) {
      var deferred = Q.defer();
      var collection = api.mongo.collections.loggerSystems;

      collection.findOne({name:name}, deferred.makeNodeResolver());

      return deferred.promise;
    }
  }

  next();
}
