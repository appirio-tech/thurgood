var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;
var request = require('request');

/**
 * GET /accounts
 * GET /accounts/:id
 */
exports.action = {
  name: "accountsFetch",
  description: "Returns a list of accounts, or a specific one if id is defined. Method: GET",
  inputs: {
    required: [],
    optional: ['q', 'fields', 'sort', 'limit', 'skip', 'id'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    api.mongo.get(api, connection, next, api.mongo.collections.loggerAccounts);
  }
};

/**
 * POST /accounts
 */
exports.accountsCreate = {
  name: "accountsCreate",
  description: "Creates a new account. Method: POST",
  inputs: {
    required: ['username', 'email'],
    optional: ['papertrailId'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var accountDoc = api.mongo.schema.new(api.mongo.schema.loggerAccount);
    accountDoc.name = connection.params.username;
    accountDoc.email = connection.params.email;
    accountDoc.papertrailId = connection.params.papertrailId || accountDoc.name;

    var params = {
      id: accountDoc.papertrailId,
      name: accountDoc.name,
      plan: "free",
      user: {
        id: accountDoc.name,
        email: accountDoc.email
      }
    };

    // Create Papertrail account
    request.post({ url: api.configData.papertrail.accountsUrl , form: params, auth: api.configData.papertrail.auth }, function (err, response, body) {
      if (err) {
        api.response.error(connection, err);
        next(connection, true);
      } else {
        body = JSON.parse(body);
        if (!body.id || !body.api_token) {
          // Check if the account already exists
          api.mongo.collections.loggerAccounts.findOne({ name: connection.params.username }, function(err, account) {
            if (!err && account) {
              api.response.success(connection, "Account already exists", account, 200);
            } else {
              api.response.error(connection, body.message);
            }

            next(connection, true);
          });
        } else {
          accountDoc.papertrailId = body.id;
          accountDoc.papertrailApiToken = body.api_token;
          
          // Insert document into the database
          api.mongo.collections.loggerAccounts.insert(accountDoc, { w:1 }, function(err, result) {
            if (!err) {
              api.response.success(connection, "Account created successfully", result, 201);
            } else {
              api.response.error(connection, err);
            }

            next(connection, true);
          });
        }
      }
    });
  }
};

/**
 * DELETE /accounts/:id
 */
exports.accountsDelete = {
  name: "accountsDelete",
  description: "Deletes an account. Method: DELETE",
  inputs: {
    required: ['id'],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var selector;

    // Validate id and build selector
    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      api.response.badRequest(connection, "Id is not a valid ObjectID");
      return next(connection, true);
    }

    // Delete account from database and Papertrail
    api.mongo.collections.loggerAccounts.findAndModify(selector, {}, {}, { remove: true }, function(err, doc) {
      if (!err && doc) {
        request.del({ url: api.configData.papertrail.accountsUrl + "/" + doc.papertrailId, auth: api.configData.papertrail.auth }, function (err, response, body) {
          if (!err) {
            api.response.success(connection, "Account deleted successfully");
          } else {
            api.response.error(connection, err);
          }
          
          next(connection, true);
        });
      } else if (!doc) {
        api.response.error(connection, "Account not found");
        next(connection, true);
      } else {
        api.response.error(connection, err);
        next(connection, true);
      }
    });
  }
};
