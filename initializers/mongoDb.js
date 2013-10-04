var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var Schema = require('../schema.js');

exports.mongoDb = function (api, next) {
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
      api.mongo.schema.server = Schema.server;
      api.mongo.schema.job = Schema.job;
      api.mongo.schema.apiKey = Schema.apiKey;
      api.mongo.schema.loggerAccount = Schema.loggerAccount;
      api.mongo.schema.loggerSystem = Schema.loggerSystem;

      /**
       * Sets a schema's id and timestamps
       * @param  {object} schema [description]
       * @return {schema}        [description]
       */
      api.mongo.schema.new = function(schema) {
        schema._id = new ObjectID();
        schema.createdAt = new Date().getTime();
        schema.updatedAt = new Date().getTime();
        return schema;
      };

      // Disconnect from the database when the server shuts down
      api.mongo._teardown = function(api, next) {
        api.mongo.db.close();
        next();
      }

      next();
    } else {
      api.log("Couldn't connect to MongoDB", "error");
      api.log(err, "error");
      next();
    }
  });
};
