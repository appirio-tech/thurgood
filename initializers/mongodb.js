var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var Schema = require('../schema.js');
var _ = require('underscore');

exports.mongodb = function (api, next) {
  api.mongo = {};
  api.mongo.collections = {};
  api.mongo.schema = {};

  // Connect to the database
  MongoClient.connect(api.configData.mongo.serverUri, { server: { auto_reconnect: true } }, function(err, db) {
    if(!err) {
      api.log("Connected to MongoDB", "notice");
      api.mongo.db = db;

      // Define collections
      api.mongo.collections.servers = db.collection('servers');
      api.mongo.collections.jobs = db.collection('jobs');
      api.mongo.collections.apiKeys = db.collection('apiKeys');
      api.mongo.collections.loggerAccounts = db.collection('loggerAccounts');
      api.mongo.collections.loggerSystems = db.collection('loggerSystems');

      // Define document schemas
      api.mongo.schema = Schema;

      // Export functions
      api.mongo.get = get;
      api.mongo.create = create;
      api.mongo.update = update;

      api.mongo.schema.new = newSchema;
      api.mongo._teardown = teardown;

      next();
    } else {
      api.log("Couldn't connect to MongoDB", "error");
      api.log(err, "error");
      next();
    }
  });
};

/**
 * Sets a schema's id and timestamps
 * @param  {object} schema [description]
 * @return {schema}        [description]
 */
function newSchema(schema) {
  schema = _.extend({}, schema);
  schema._id = new ObjectID();
  schema.createdAt = new Date().getTime();
  schema.updatedAt = new Date().getTime();
  return schema;
};

/**
 * Find documents method, used in GET endpoints
 * @param  {[type]}   api        [description]
 * @param  {[type]}   connection [description]
 * @param  {Function} next       [description]
 * @param  {[type]}   collection Collection to query
 * @return {[type]}              [description]
 */
function get(api, connection, next, collection) {
  var selector, fields, sort, options = {};

  // If id is defined, override selector
  if (connection.params.id) {
    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      api.response.badRequest(connection, "Id is not a valid ObjectID");
      return next(connection, true);
    }
  } 

  // Otherwise if status is defined, override selector
  // Custom parameter for the GET /servers/:id?status=<status> endpoint
  else if (connection.params.status) {
    selector = { status: connection.params.status };
  } 

  // Otherwise try to parse selector parameter
  else {
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
  
  // Options parameters. Ignore them if id is defined as they're not needed
  if (!connection.params.id) {
    // Try to parse sort parameter
    try {
      sort = JSON.parse(connection.params.sort);
    } catch(err) {
      sort = undefined;
    }

    options.limit = connection.params.limit;
    options.skip = connection.params.skip;
    options.sort = sort;
  }

  // Find documents
  collection.find(selector, fields, options).toArray(function(err, docs) {
    if (!err) {
      // If this is a GET /accounts/:id request and loggerSystems is included in the projection then return the corresponding loggers too
      if (connection.params.action == 'accountsFetch' && connection.params.id && (_.keys(fields).length == 0 || fields.loggerSystems == 1)) {
        api.mongo.collections.loggerSystems.find({ loggerAccountId: docs[0]._id }).toArray(function(err, loggerDocs) {
          if (!err) {
            docs[0].loggerSystems = loggerDocs;
            api.response.success(connection, undefined, docs);
          } else {
            api.response.error(connection, err);
          }

          next(connection, true);
        })
      } else if (connection.params.id && docs.length == 0) {
        api.response.error(connection, "Document not found", undefined, 404);
        next(connection, true);
      } else {
        api.response.success(connection, undefined, docs);
        next(connection, true);
      }
    } else {
      api.response.error(connection, err);
      return next(connection, true);
    }
  });
}

/**
 * Create method, used in POST endpoints
 * @param  {[type]}   api        [description]
 * @param  {[type]}   connection [description]
 * @param  {Function} next       [description]
 * @param  {[type]}   collection Collection to query
 * @param  {[type]}   schema     Document schema
 * @return {[type]}              [description]
 */
function create(api, connection, next, collection, schema) {
  var doc = newSchema(schema);

  // Assign parameters
  _.each(doc, function(value, key) {
    // If schema field is found in params
    if (_.contains(_.keys(connection.params), key)) {
      // If it's defined as a json object in the schema parse the value
      if ((_.isArray(doc[key]) || _.isObject(doc[key])) && !(doc[key] instanceof ObjectID)) {
        try {
          doc[key] = JSON.parse(connection.params[key]);
        } catch(err) {
          api.response.error(connection, "Parameter " + key + " is not a valid JSON object", undefined, 400);
          return next(connection, true);
        }
      }
      
      // Otherwise if it's an ObjectID try to parse it
      else if (doc[key] instanceof ObjectID) {
        try {
          doc[key] = new ObjectID(connection.params[key]);
        } catch(err) {
          api.response.error(connection, "Parameter " + key + " is not a valid ObjectID", undefined, 400);
          return next(connection, true);
        }
      }

      // Otherwise use its value as-is
      else {
        doc[key] = connection.params[key];
      }
    }
  });

  // Insert document
  collection.insert(doc, { w:1 }, function(err, result) {
    api.response.auto(connection, err, "Document created successfully", result, 201);
    next(connection, true);
  });
}

/**
 * Update method, used in PUT endpoints
 * @param  {[type]}   api        [description]
 * @param  {[type]}   connection [description]
 * @param  {Function} next       [description]
 * @param  {[type]}   collection Collection to query
 * @param  {[type]}   schema     Document schema
 * @return {[type]}              [description]
 */
function update(api, connection, next, collection, schema) {
  var selector, doc = {};

  // Add the new values to the doc
  _.each(connection.params, function(paramValue, paramKey) {
    // If param key is found in the schema
    if (paramKey != 'id' && _.contains(_.keys(schema), paramKey)) {
      // If it's defined as a json object in the schema parse the value
      if (_.isArray(schema[paramKey]) || _.isObject(schema[paramKey])) {
        try {
          doc[paramKey] = JSON.parse(paramValue);
        } catch(err) {
          api.response.error(connection, "Parameter " + paramKey + " is not a valid JSON object", undefined, 400);
          return next(connection, true);
        }
      } else {
        doc[paramKey] = paramValue;
      }
    }
  });

  // Validate id and build selector
  try {
    selector = { _id: new ObjectID(connection.params.id) };
  } catch(err) {
    api.response.badRequest(connection, "Id is not a valid ObjectID");
    return next(connection, true);
  }

  // Update document
  doc.updatedAt = new Date().getTime();
  collection.findAndModify(selector, {}, { $set: doc }, { new: true, w:1 }, function(err, result) {
    api.response.auto(connection, err, "Document updated successfully", result);
    next(connection, true);
  });
}

/**
 * Disconnect from the database when the server shuts down
 * @param  {[type]}   api  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function teardown(api, next) {
  api.mongo.db.close();
  next();
}
