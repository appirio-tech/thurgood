var MongoClient = require('mongodb').MongoClient;
var schema = require('../schema.js');

exports.mongoDb = function (api, next) {
  api.mongo = {};
  api.mongo.collections = {};
  api.mongo.schema = {};

  // Connect to the database
  MongoClient.connect(api.configData.mongo.serverUri, function(err, db) {
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
      api.mongo.schema.server = schema.server;
      api.mongo.schema.job = schema.job;
      api.mongo.schema.apiKey = schema.apiKey;
      api.mongo.schema.loggerAccount = schema.loggerAccount;
      api.mongo.schema.loggerSystem = schema.loggerSystem;

      next();
    } else {
      api.log("Couldn't connect to MongoDB", "error");
      api.log(err, "error");
      next();
    }
  });
};
