var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;

exports.action = {
  name: "jobsCreate",
  description: "Creates a new job. Method: POST",
  inputs: {
    required: [],
    optional: ['status', 'email', 'platform', 'language', 'papertrailSystem', 'userId', 'codeUrl', 'options', 'startTime', 'endTime'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var serverDoc = api.mongo.schema.new(api.mongo.schema.job);

    // Assign parameters
    _.each(serverDoc, function(value, key) {
      if (_.contains(Object.keys(connection.params), key)) {
        serverDoc[key] = connection.params[key];
      }
    });

    // Insert document
    api.mongo.collections.jobs.insert(serverDoc, { w:1 }, function(err, result) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 201;
        connection.response = {
          success: true,
          message: "Job created successfully",
          data: result
        };
      } else {
        connection.rawConnection.responseHttpCode = 500;
        connection.error = err;
        connection.response = {
          success: false,
          message: err
        };
      }

      next(connection, true);
    });
  }
};
