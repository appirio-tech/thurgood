var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;
var request = require('request');

exports.action = {
  name: "accountsFetch",
  description: "Returns a specific account. Method: GET",
  inputs: {
    required: ['id'],
    optional: ['fields'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var accountsCollection = api.mongo.collections.loggerAccounts;
    var fields;
    
    // Try to parse fields parameter
    try {
      fields = JSON.parse(connection.params.fields);
    } catch(err) {
      fields = {};
    }

    // Find account
    accountsCollection.findOne({ _id: new ObjectID(connection.params.id) }, fields, function(err, doc) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 200;
        connection.response = {
          success: true,
          data: doc
        };

        next(connection, true);
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };

        next(connection, true);
      }
    });
  }
};

exports.accountsCreate = {
  name: "accountsCreate",
  description: "Creates a new account. Method: POST",
  inputs: {
    required: ['username', 'email'],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var accountsCollection = api.mongo.collections.loggerAccounts;
    var accountDoc = api.mongo.schema.new(api.mongo.schema.loggerAccount);
    accountDoc.name = connection.params.username;
    accountDoc.email = connection.params.email;

    var params = {
      id: 'cs-dev-' + accountDoc.name,
      name: accountDoc.name,
      plan: "free",
      user: {
        id: accountDoc.name,
        email: accountDoc.email
      }
    };

    var auth = {
      username: "cloudspokes",
      password: "239f45c2eu4d709m3c56684e827508d6"
    };

    // Create Papertrail account
    request.post({ url: "https://papertrailapp.com/api/v1/distributors/accounts", form: params, auth: auth }, function (err, response, body) {
      console.log(body);
      if (err) {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };

        next(connection, true);
      } else {
        body = JSON.parse(body);
        if (!body.id || !body.api_token) {
          connection.rawConnection.responseHttpCode = 500;
          connection.error = body.message;
          connection.response = {
            success: false,
            message: "Could not create account in Papertrail (probably already exists)"
          };

          next(connection, true);
        } else {
          accountDoc.papertrailId = body.id;
          accountDoc.papertrailApiToken = body.api_token;
          
          // Insert document into the database
          accountsCollection.insert(accountDoc, { w:1 }, function(err, result) {
            if (!err) {
              connection.rawConnection.responseHttpCode = 201;
              connection.response = {
                success: true,
                message: "Account created successfully",
                data: result
              };

              next(connection, true);
            } else {
              connection.rawConnection.responseHttpCode = 500;
              connection.error = err;
              connection.response = {
                success: false,
                message: err
              };

              next(connection, true);
            }
          });
        }
      }
    });
  }
};
