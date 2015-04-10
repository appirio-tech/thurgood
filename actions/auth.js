var Q = require("q");
var _ = require('underscore');
var openid = require('openid');
var GOOGLE_ENDPOINT = 'https://www.google.com/accounts/o8/id';
var request = require('request');
var open = require('open');
var url = require('url');
var querystring = require('querystring');
var jwt = require('jsonwebtoken');
var google = require('googleapis');
var http =  require('http');
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
      redirectTo('https://accounts.google.com//o/oauth2/auth?response_type=code&client_id=129549620262-5boveov8v4quodro74fve6gtht49puvu.apps.googleusercontent.com&redirect_uri='+api.configData.google.redirectUrl+'&scope=openid%20email%20profile');
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
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
    run: function(api, connection, next) {       
          var url_parts = url.parse(connection.rawConnection.req.url, true);
     console.log('URL Parts', url_parts);
  var query = url_parts.query;
  console.log('query', query);
      var isAuthenticated = false;
      var decoded = null;
      var fullname = null;
      var email = null;
      
      request.post({url:'https://www.googleapis.com/oauth2/v3/token', form: {code: query.code , client_id:'129549620262-5boveov8v4quodro74fve6gtht49puvu.apps.googleusercontent.com', client_secret:'PFMCq-bj0fJFFV6YcN1rW4po', redirect_uri:api.configData.google.redirectUrl, grant_type:'authorization_code'}}, 
      function(err,httpResponse,body){ 
                    var bodyParsed = JSON.parse(body);
      console.log('body Parsed', bodyParsed);
      console.log('decoded', jwt.decode(bodyParsed.id_token));
               decoded = jwt.decode(bodyParsed.id_token);                      
               isAuthenticated = decoded.email_verified;
               email = decoded.email;          
               var plus = google.plus('v1');
               var OAuth2 = google.auth.OAuth2;
               var CLIENT_ID = '129549620262-5boveov8v4quodro74fve6gtht49puvu.apps.googleusercontent.com';
               var CLIENT_SECRET = 'PFMCq-bj0fJFFV6YcN1rW4po';
               var REDIRECT_URL = 'http://thurgood-production.herokuapp.com/api/auth/google/return';
               var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
               oauth2Client.setCredentials({
                       access_token : bodyParsed.access_token                  
               });     
               plus.people.get({ userId: decoded.sub, auth: oauth2Client }, function(err, response) {
                               // handle err and response
                               if (err) {
                                       console.log('An error occured', err);
                                       return;
                               }
                               //var profile = JSON.parse(response.name);                      
                               fullname = response.displayName; 
    if(isAuthenticated != true) {
      return handleError(new Error("Authentication Failed"));
    }

    
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
				
		});		
	});
	    //var fullname = connection.params["openid.ext1.value.firstname"] + " " + connection.params["openid.ext1.value.lastname"];
	 
   

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



