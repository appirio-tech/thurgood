var Q = require("q");
var _ = require('underscore');
var crypto = require('crypto');
var userRoles = require('../public/js/routingConfig').userRoles;
var accessLevels = require('../public/js/routingConfig').accessLevels;

// User email and role mapping table
// This is a temporay solution. 
var userRoleMap = {
  "jdouglas@appirio.com": userRoles.admin
};

/*
  user model, it uses promise.
  Usage is like below

  - Find
     var email = "some@email.com"
     api.users.findByEmail(email)
     .then(function(user) {// doSomething})
     .fail(function(error) {// handles error});
    
  - Create
     api.users.create({email: email, name: "fullname"})
     .then(function(user) {// doSomething})
     .fail(function(error) {// handles error});
  
  - Delete
     api.users.delete({email:email})
     .then(function(user) {// doSomething})
     .fail(function(error) {// handles error});
*/
exports.users = function(api, next){

  api.users = {
    // find user by email
    // it returns promise.
    findByEmail: function(email) {
      var deferred = Q.defer();
      var collection = api.mongo.collections.users;

      collection.findOne({email:email}, deferred.makeNodeResolver());

      return deferred.promise;
    },

    // creates a user with api key and role.
    // it returns promise.
    //
    // Setting role and apiKey is a temporay solution.
    // It will be changed following the right flow.
    // 
    // It checks if the domain of email is valid.
    // It will raise an error if not.
    create: function(attrs) {
      var deferred = Q.defer();
      var collection = api.mongo.collections.users;
      var doc = api.mongo.schema.new(api.mongo.schema.user);
      doc = _.extend(doc, attrs);

      // sets role using userRoleMap table.
      doc.role = userRoleMap[attrs.email] || userRoles.user;

      // checks if the email is valid
      if(isValidEmail(attrs.email) == false) {
        deferred.reject(new Error(attrs.email + " is not allowed"));        
        return deferred.promise;
      }

      // sets a random generated string to apiKey.
      crypto.randomBytes(16, function(ex, buf) {
        doc.apiKey = buf.toString('hex');

        console.log("[User]", "create user", doc);
        collection.insert(doc, {safe: true}, function(err, result) {
          if(err) { return deferred.reject(err); }
          deferred.resolve(doc);
        });
      });      

      return deferred.promise;
    },

    // deletes a user by email
    // it returns promise
    delete: function(user) {
      var deferred = Q.defer();
      var collection = api.mongo.collections.users;

      collection.findAndModify({email: user.email}, {}, {}, { remove: true }, deferred.makeNodeResolver());

      return deferred.promise;
    },

    // returns true if a user is accessbile to an action.
    //         falase otherwise.
    isAccessible: function(user, action) {
      var role = (user && user.role) ? user.role : userRoles.anon;
      var access = action.access || accessLevels.public;

      return access.bitMask & role.bitMask;
    }
  }

  // returns true if emails ends with "@cloudspokes.com" or "@appirio.com"
  function isValidEmail(email) {
    //return !!email.match(/.+@(cloudspokes|apprio).com$/);
    return email.indexOf("@appirio.com") > 0 ? true : false
  }

  next();
}
