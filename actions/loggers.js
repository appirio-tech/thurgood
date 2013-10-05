var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;
var request = require('request');
var Q = require("q");
var papertrail = require("../lib/papertrail");
var Errors = require("../lib/errors");
var utils = require("../lib/utils");
var crypto = require('crypto');

exports.action = {
  name: "loggersFetch",
  description: "Returns a logger. Method: GET",
  inputs: {
    required: ['id'],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var collection = api.mongo.collections.loggerSystems;

    // find logger and response.
    Q.ninvoke(collection, "findOne", {papertrailId: connection.params.id})
      .then(respondOk)
      .fail(respondError)
      .done();


    function respondOk(logger) {
      if(!logger) {
        // if logger does not exist, throws not found error.
        throw new Errors.NotFoundError("logger of papertrailId " + connection.params.id + " does not exist");
      }
      
      utils.setDataForResponse(connection, logger);
      next(connection, true);
    }

    function respondError(err) {
      utils.setErrorForResponse(connection, err);
      next(connection, true);
    }
  }
};

exports.loggersCreate = {
  name: "loggersCreate",
  description: "Creates a new logger. Method: POST",
  inputs: {
    required: ['name', 'loggerAccountId', 'papertrailAccountId'],
    optional: ['papertrailId'],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var collection = api.mongo.collections.loggerSystems;

    // first check if the logger of papertrailAccountId exists
    // if exists, respond with it.
    // if not exists, create one.
    var selector = { papertrailAccountId: connection.params.papertrailAccountId };
    collection.findOne(selector, function(err, doc) {
      if (doc) {
        console.log("[LoggerCreate] logger exists, respond with it");
        return respondOk(doc);
      }

      createLogger();
    });


    // create a logger 
    // 1. create logger on papertrail
    // 2. create logger to the db
    // 3. and respond with the created logger
    function createLogger() {
      Q.all([api.configData.papertrail, buildLogger()])
        .spread(papertrail.createLogger)
        .then(insertLogger)
        .then(respondOk)
        .fail(respondError)
        .done();
    }


    function buildLogger() {
      var logger = api.mongo.schema.new(api.mongo.schema.loggerSystem);
      logger.name = connection.params.name;
      logger.loggerAccountId = connection.params.loggerAccountId;
      logger.papertrailAccountId = connection.params.papertrailAccountId;
      if (!connection.params.papertrailId) {
        // fill random generated string if papertrailId is not present.
        logger.papertrailId = crypto.randomBytes(24).toString('hex');
      }

      console.log("[LoggerCreate]", "Build Logger : " + logger);
      return logger;
    }

    // Insert document into the database
    function insertLogger(logger) {
      console.log("[LoggerCreate]", "Insert Logger to DB : " + logger);

      var deferred = Q.defer();
      collection.insert(logger, deferred.makeNodeResolver());
      return deferred.promise;
    }

    function respondOk(logger) {
      utils.setDataForResponse(connection, logger);
      next(connection, true);
    }

    function respondError(err) {
      utils.setErrorForResponse(connection, err);
      next(connection, true);
    }

  }
};

exports.loggersDelete = {
  name: "loggersDelete",
  description: "Deletes an logger. Method: DELETE",
  inputs: {
    required: ['id'],
    optional: [],
  },
  authenticated: false,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var collection = api.mongo.collections.loggerSystems;

    papertrail.deleteLogger(api.configData.papertrail, connection.params.id)
      .then(deleteLogger)
      .then(respondOk)
      .fail(respondError)
      .done();


    function deleteLogger(papertrailId) {
      console.log("[loggersDelete]", "Delete Logger from DB : " + papertrailId);

      var deferred = Q.defer();
      var selector = {papertrailId: papertrailId};
      collection.findAndModify(selector, {}, {}, { remove: true }, deferred.makeNodeResolver());

      return deferred.promise;
    }


    function respondOk() {
      utils.setDataForResponse(connection, {});
      next(connection, true);
    }

    function respondError(err) {
      utils.setErrorForResponse(connection, err);
      next(connection, true);
    }


  }
};