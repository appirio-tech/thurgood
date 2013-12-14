var Q = require("q");
var _ = require('underscore');

/*
  loggerAccounts model, it uses promise.
*/
exports.loggerAccounts = function(api, next){

  api.loggerAccountsloggerAccounts = {

    // creates a job, and returns promise.
    findByNameAndEmail: function(name, email) {
      var deferred = Q.defer();
      var collection = api.mongo.collections.loggerAccounts;

      collection.findOne({name:name, email: email}, deferred.makeNodeResolver());

      return deferred.promise;
    }
  }

  next();
}
