var Q = require("q");
var _ = require('underscore');

exports.session = function(api, next){

  var prefix = "__session:";

  api.session = {
    set: function(connection, name, value) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.hset(key, name, value, deferred.makeNodeResolver());

      return deferred.promise;
    },

    load: function(connection) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.hgetall(key, deferred.makeNodeResolver());

      return deferred.promise;
    },

    get: function(connection, name) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.hget(key, name, deferred.makeNodeResolver());      

      return deferred.promise;
    },

    del: function(connection, name) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.hdel(key, name, deferred.makeNodeResolver());      

      return deferred.promise;      
    },

    clear: function(connection) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.del(key, deferred.makeNodeResolver());      

      return deferred.promise;

    },

    setCurrentUser: function(connection, user) {
      return this.set(connection, "user", JSON.stringify(user));
    },

    getCurrentUser: function(connection) {
      var deferred = Q.defer();

      this.get(connection, "user").then(function(json) {
        deferred.resolve(JSON.parse(json));
      }, deferred.reject);

      return deferred.promise;
    }
    
  }
  next();
}
