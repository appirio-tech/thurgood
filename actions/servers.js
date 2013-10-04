var _ = require('underscore');

exports.action = {
  name: "serversCreate",
  description: "Creates a new server. Method: POST",
  inputs: {
    required: [],
    optional: ['name', 'status', 'instanceUrl', 'operatingSystem', 'installedServices', 'languages', 'platform', 'repoName', 'username', 'password', 'jobId'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var serversCollection = api.mongo.collections.servers;
    var serverDoc = api.mongo.schema.new(api.mongo.schema.server);

    // Assign parameters
    _.each(serverDoc, function(value, key) {
      if (connection.params[key]) {
        serverDoc[key] = connection.params[key];
      }
    });

    // Insert document
    serversCollection.insert(serverDoc, {w:1}, function(err, result) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 201;
        connection.response = {
          success: true,
          message: "Server created successfully",
          data: result
        };

        next(connection, true);
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err,
          data: undefined
        };

        next(connection, true);
      }
    });
  }
};

exports.serversList = {
  name: "serversList",
  description: "Retrieves all the servers. Method: GET",
  inputs: {
    required: [],
    optional: ['q', 'fields', 'sort', 'limit', 'skip'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var serversCollection = api.mongo.collections.servers;
    var selector, fields, sort, options = {};

    // Try to parse selector parameter
    try {
      selector = JSON.parse(connection.params.q);
    } catch(err) {
      selector = {};
    }
    
    // Try to parse fields parameter
    try {
      fields = JSON.parse(connection.params.fields);
    } catch(err) {
      fields = {};
    }
    
    // Try to parse sort parameter
    try {
      sort = JSON.parse(connection.params.sort);
    } catch(err) {
      sort = undefined;
    }

    // Options parameters
    options.limit = connection.params.limit;
    options.skip = connection.params.skip;
    options.sort = sort;

    // Find servers
    serversCollection.find(selector, fields, options).toArray(function(err, docs) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 200;
        connection.response = {
          success: true,
          message: undefined,
          data: docs
        };

        next(connection, true);
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err,
          data: undefined
        };

        next(connection, true);
      }
    });
  }
};
