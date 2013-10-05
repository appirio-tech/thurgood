var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;

exports.action = {
  name: "jobsFetch",
  description: "Returns a list of jobs, or a specific one if id is defined. Method: GET",
  inputs: {
    required: [],
    optional: ['q', 'fields', 'sort', 'limit', 'skip', 'id'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var selector, fields, sort, options = {};

    // If id is defined, override selector
    if (connection.params.id) {
      try {
        selector = { _id: new ObjectID(connection.params.id) };
      } catch(err) {
        connection.rawConnection.responseHttpCode = 400;
        connection.response = {
          success: false,
          message: "Invalid id"
        };

        next(connection, true);
        return;
      }
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

    // Find jobs
    api.mongo.collections.jobs.find(selector, fields, options).toArray(function(err, docs) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 200;
        connection.response = {
          success: true,
          data: docs
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

exports.jobsCreate = {
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
    var jobDoc = api.mongo.schema.new(api.mongo.schema.job);

    // Assign parameters
    _.each(jobDoc, function(value, key) {
      if (_.contains(Object.keys(connection.params), key)) {
        jobDoc[key] = connection.params[key];
      }
    });

    // Insert document
    api.mongo.collections.jobs.insert(jobDoc, { w:1 }, function(err, result) {
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

exports.jobsUpdate = {
  name: "jobsUpdate",
  description: "Updates a job. Method: PUT",
  inputs: {
    required: ['id'],
    optional: ['status', 'email', 'platform', 'language', 'papertrailSystem', 'userId', 'codeUrl', 'options', 'startTime', 'endTime'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var selector, jobDoc = {};

    // Create a document with the new values
    _.each(connection.params, function(paramValue, paramKey) {
      if (paramKey != 'id' && _.contains(Object.keys(api.mongo.schema.job), paramKey)) {
        jobDoc[paramKey] = paramValue;
      }
    });

    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      connection.rawConnection.responseHttpCode = 400;
      connection.response = {
        success: false,
        message: "Invalid id"
      };

      next(connection, true);
      return;
    }

    // Update document
    jobDoc.updatedAt = new Date().getTime();
    api.mongo.collections.jobs.findAndModify(selector, {}, { $set: jobDoc }, { new: true, w:1 }, function(err, result) {
      if (!err) {
        connection.rawConnection.responseHttpCode = 200;
        connection.response = {
          success: true,
          message: "Job updated successfully",
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
