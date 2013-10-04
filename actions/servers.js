var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;

exports.action = {
  name: "serversFetch",
  description: "Returns a list of servers, or a specific one if id is defined. Method: GET",
  inputs: {
    required: [],
    optional: ['q', 'fields', 'sort', 'limit', 'skip', 'status', 'id'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var serversCollection = api.mongo.collections.servers;
    var selector, fields, sort, options = {};

    // If id is defined, override selector
    if (connection.params.id) {
      selector = { _id: new ObjectID(connection.params.id) };
    } else if (connection.params.status) {
      // Otherwise if status is defined, override selector
      selector = { status: connection.params.status };
    } else {
      // Otherwise try to parse selector parameter
      try {
        selector = JSON.parse(connection.params.q);
      } catch(err) {
        selector = {};
      }
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

    // Options parameters. Ignore them if id is defined
    if (!connection.params.id) {
      options.limit = connection.params.limit;
      options.skip = connection.params.skip;
      options.sort = sort;
    }

    // Find servers
    serversCollection.find(selector, fields, options).toArray(function(err, docs) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 200;
        connection.response = {
          success: true,
          data: docs
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

exports.serversCreate = {
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
      if (_.contains(Object.keys(connection.params), key)) {
        serverDoc[key] = connection.params[key];
      }
    });

    // Insert document
    serversCollection.insert(serverDoc, { w:1 }, function(err, result) {
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
          message: err
        };

        next(connection, true);
      }
    });
  }
};

exports.serversUpdate = {
  name: "serversUpdate",
  description: "Updates a server. Method: PUT",
  inputs: {
    required: [],
    optional: ['id', 'name', 'status', 'instanceUrl', 'operatingSystem', 'installedServices', 'languages', 'platform', 'repoName', 'username', 'password', 'jobId'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var serversCollection = api.mongo.collections.servers;
    var serverDoc = {};

    // Create a document with the new values
    _.each(connection.params, function(paramValue, paramKey) {
      if (paramKey != 'id' && _.contains(Object.keys(api.mongo.schema.server), paramKey)) {
        serverDoc[paramKey] = paramValue;
      }
    });

    // Update document
    serverDoc.updatedAt = new Date().getTime();
    serversCollection.findAndModify({ _id: new ObjectID(connection.params.id) }, {}, { $set: serverDoc }, { new: true, w:1 }, function(err, result) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 200;
        connection.response = {
          success: true,
          message: "Server updated successfully",
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
};
