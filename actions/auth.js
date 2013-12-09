var Q = require("q");
var _ = require('underscore');
var openid = require('openid');
var GOOGLE_ENDPOINT = 'https://www.google.com/accounts/o8/id';
var extensions = [new openid.AttributeExchange(
                  {
                    "http://axschema.org/contact/email": "required",
                    'http://axschema.org/namePerson/first': 'required',
                    'http://axschema.org/namePerson/last': 'required'
                  })];

/**
 * GET /api/auth/google
 */
exports.action = {
  name: "googleAuthStart",
  description: "Starts Google OAuth",
  inputs: {
    required: [],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {

    getGoogleAuthUrl()
    .then(redirectTo)
    .fail(handleError)
    .done();

    function getGoogleAuthUrl() {
      var deferred = Q.defer();

      var relyingParty = new openid.RelyingParty(
        api.configData.google.redirectUrl, // callback url
        null, // realm (optional)
        false, // stateless
        false, // strict mode
        extensions); // List of extensions to enable and include
      
      relyingParty.authenticate(GOOGLE_ENDPOINT, false, deferred.makeNodeResolver());

      return deferred.promise;
    }

    function handleError(error) {
      console.log("[Google Auth Start] Error : ", error)
      redirectTo("/");
    }

    function redirectTo(path) {
      connection.response.redirectURL = path;  
      connection.rawConnection.responseHeaders.push(['Location', path]);
      connection.rawConnection.responseHttpCode = 302;

      next(connection, true);
    }

  }
};

/**
 * GET /api/auth/google/return
 */
exports.googleAuthReturn = {
  name: "googleAuthReturn",
  description: "Return path for Google OAuth",
  inputs: {
    required: [],
    optional: ["openid.mode", "openid.ext1.value.email", "openid.ext1.value.firstname", "openid.ext1.value.lastname"],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {

    if(connection.params["openid.mode"] !== "id_res") {
      return handleError(new Error("Authentication Failed"));
    }

    var email = connection.params["openid.ext1.value.email"];
    var fullname = connection.params["openid.ext1.value.firstname"] + " " + connection.params["openid.ext1.value.lastname"];

    // flows
    // 1. find a user by email
    // 2. creates a user if not exist
    // 3. sets apikey and add user to session.
    // 4. redirect to previous path
    api.users.findByEmail(email)
    .then(createUserIfNotExist)
    .then(setApiKey)
    .then(addUserToSession)
    .then(handleSuccess)
    .fail(handleError)
    .done();

    function createUserIfNotExist(user) {
      return user || api.users.create({email: email, name: fullname});
    }

    function setApiKey(user) {
      api.redis.client.hset("api:keys", user.apiKey, user.email);
      return user;
    }

    function addUserToSession(user) {
      var deferred = Q.defer();

      api.session.setCurrentUser(connection, user).then(function() {
        deferred.resolve(user);
      }, deferred.reject);

      return deferred.promise;
    }

    function handleSuccess(user) {
      console.log("[Google Auth] : User", user.email, "successfully logged in!")
      redirectTo("/");  
    }

    function handleError(error) {
      api.session.set(connection, "message", error.message);
      console.log("[Google Auth] Error : ", error)
      redirectTo("/");
    }

    function redirectTo(path) {
      connection.response.redirectURL = path;  
      connection.rawConnection.responseHeaders.push(['Location', path]);
      connection.rawConnection.responseHttpCode = 302;

      next(connection, true);
    }

  }
};


/**
 * GET /api/userinfo
 */
exports.fetchCurrentUser = {
  name: "fetchCurrentUser",
  description: "fetches current logged in user info",
  inputs: {
    required: [],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {

    api.session.getCurrentUser(connection)
    .then(getStatusMessage)
    .spread(respondOk)
    .fail(respondError)
    .done();

    function getStatusMessage(user) {
      var deferred = Q.defer();
      
      api.session.get(connection, "message").then(function(msg) {
        api.session.del(connection, "message");
        deferred.resolve([user, msg]);
      }, deferred.reject);

      return deferred.promise;
    }

    function respondOk(user, message) {
      api.response.success(connection, message, user);
      next(connection, true);
    }

    function respondError(err) {
      console.log("[fetchCurrentUser] Error : ", err)
      api.response.error(connection, err);
      next(connection, true);
    }

  }
};

/**
 * GET /logout
 */
exports.logout = {
  name: "logout",
  description: "logout",
  inputs: {
    required: [],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {

    api.session.clear(connection)
    .then(respondOk)
    .fail(respondError)
    .done();

    function respondOk(user) {
      api.response.success(connection, undefined, {});
      next(connection, true);
    }

    function respondError(err) {
      api.response.error(connection, err);
      next(connection, true);
    }

  }
}



