var Q = require("q");
var _ = require('underscore');

// session managemnet.
// It uses redis to store information with the key connection.id
// All returns promise. so the usage is like below
//
// api.session.set(connection, "name", "jack").then(function() { //...})
// api.session.get(connection, "name").then(function(name) { //...})
exports.session = function(api, next){

  var prefix = "__session:";

  api.session = {

    // sets a name, value to the session.
    set: function(connection, name, value) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.hset(key, name, value, deferred.makeNodeResolver());

      return deferred.promise;
    },

    // load all values from the session.
    load: function(connection) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.hgetall(key, deferred.makeNodeResolver());

      return deferred.promise;
    },

    // gets the value of name
    get: function(connection, name) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.hget(key, name, deferred.makeNodeResolver());      

      return deferred.promise;
    },

    // deletes a value of name
    del: function(connection, name) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.hdel(key, name, deferred.makeNodeResolver());      

      return deferred.promise;      
    },

    // deletes all the values
    clear: function(connection) {
      var deferred = Q.defer();
      var key = prefix + connection.id;

      api.redis.client.del(key, deferred.makeNodeResolver());      

      return deferred.promise;

    },

    // sets current user info to the sesion with the json format.
    setCurrentUser: function(connection, user) {
      return this.set(connection, "user", JSON.stringify(user));
    },

    // retrieves current user info from the session.
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
