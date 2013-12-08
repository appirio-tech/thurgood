var _ = require('underscore');
var request = require('request');
var openid = require('openid');
var GOOGLE_ENDPOINT = 'https://www.google.com/accounts/o8/id';

/**
 * GET /accounts
 * GET /accounts/:id
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
    // Q.all([api, api.session.save(connection, {returnTo: "/"})])
    //     .spread(authenticateGoogle)
    //     .then(redirectTo)
    //     .fail(respondError)
    //     .done();

    var extensions = [new openid.AttributeExchange(
                      {
                        "http://axschema.org/contact/email": "required",
                        'http://axschema.org/namePerson/first': 'required',
                        'http://axschema.org/namePerson/last': 'required'
                      })];

    var relyingParty = new openid.RelyingParty(
      api.configData.google.redirectUrl, // callback url
      null, // realm (optional)
      false, // stateless
      false, // strict mode
      extensions); // List of extensions to enable and include

    relyingParty.authenticate(GOOGLE_ENDPOINT, false, function(error, authUrl) {
      if (error) {
        console.log("[Google Auth]", "Error in authenticating", error);
      } else if (!authUrl) {
        console.log("[Google Auth]", "Authentication failed - no redirect url received");
      } else {
        connection.response.redirectURL = authUrl;
        connection.rawConnection.responseHeaders.push(['Location', connection.response.redirectURL]);
        connection.rawConnection.responseHttpCode = 302;
      }

      next(connection, true);
    });

  }
};

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
    console.log("debug", connection.params)

    if(connection.params["openid.mode"] === "id_res") {
      var email = connection.params["openid.ext1.value.email"]
      var fullname = connection.params["openid.ext1.value.firstname"] + " " + connection.params["openid.ext1.value.lastname"];

      // create/get user if not exist
      // var user = api.users.find(email)
      // if(!user) user = api.users.create({email: email, name: fullname});
      // create session for user
      // api.session.save(connection, {userId: user.id})
      // api.session.delete(connection)
      // api.session.isLoggedIn(connection)
      // api.session.getCurrentUser(connection)
      // connection.response.redirectURL = api.session.get(connection, "returnTo");

      connection.response.redirectURL = "/";

    }
    else {
      connection.response.redirectURL = "/";
    }

    connection.rawConnection.responseHeaders.push(['Location', connection.response.redirectURL]);
    connection.rawConnection.responseHttpCode = 302;

    next(connection, true);
  }
}

