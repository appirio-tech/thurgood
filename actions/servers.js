exports.action = {
  name: "serversCreate",
  description: "Creates a new server. Method: POST",
  inputs: {
    required: [],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var serversCollection = api.mongo.collections.servers;
    var serverDoc = api.mongo.schema.new(api.mongo.schema.server);
    
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
          data: null
        };

        next(connection, true);
      }
    });
  }
};
