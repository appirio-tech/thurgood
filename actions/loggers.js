var ObjectID = require('mongodb').ObjectID;
var Q = require("q");
var papertrail = require("../lib/papertrail");
var crypto = require('crypto');

/**
 * GET /loggers
 * GET /loggers/:id
 */
exports.action = {
  name: "loggersFetch",
  description: "Returns a list of loggers, or a specific one if id is defined. Method: GET",
  inputs: {
    required: [],
    optional: ['q', 'fields', 'sort', 'limit', 'skip', 'id'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    api.mongo.get(api, connection, next, api.mongo.collections.loggerSystems);
  }
};

/**
 * POST /logger
 */
exports.loggersCreate = {
  name: "loggersCreate",
  description: "Creates a new logger. Method: POST",
  inputs: {
    required: ['name', 'loggerAccountId'],
    optional: ['papertrailId'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var collection = api.mongo.collections.loggerSystems;
    // Validate loggerAccountId
    try {
      connection.params.loggerAccountId = new ObjectID(connection.params.loggerAccountId);
    } catch(err) {
      api.response.error(connection, "Parameter loggerAccountId is not a valid ObjectID", undefined, 400);
      return next(connection, true);
    }

    // first check if the logger of papertrailId exists
    // if exists, respond with it.
    // if not exists, create one.
    if(connection.params.papertrailId) {
      var selector = { papertrailId: connection.params.papertrailId };
      collection.findOne(selector, function(err, doc) {
        if (doc) {
          console.log("[LoggerCreate] logger exists, respond with it");
          return respondOk(doc);
        }

        createLogger();
      });      
    }
    else {
      createLogger();
    }

    // Create a logger 
    // 1. create logger on papertrail
    // 2. create logger in the db
    // 3. respond with the created logger
    function createLogger() {
      Q.all([api, buildLogger()])
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
      logger.papertrailId = connection.params.papertrailId || crypto.randomBytes(16).toString('hex');
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
      api.response.success(connection, undefined, logger);
      next(connection, true);
    }

    function respondError(err) {
      api.response.error(connection, err);
      next(connection, true);
    }
  }
};

/**
 * PUT /loggers/:id
 */
exports.loggersUpdate = {
  name: "loggersUpdate",
  description: "Updates a logger. Method: GET",
  inputs: {
    required: ['id'],
    optional: ['name'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    api.mongo.update(api, connection, next, api.mongo.collections.loggerSystems, api.mongo.schema.loggerSystem);
  }
};

/**
 * DELETE /loggers/:id
 */
exports.loggersDelete = {
  name: "loggersDelete",
  description: "Deletes a logger. Method: DELETE",
  inputs: {
    required: ['id'],
    optional: [],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var selector, collection = api.mongo.collections.loggerSystems;

    // Validate id and build selector
    try {
      selector = { _id: new ObjectID(connection.params.id) };
    } catch(err) {
      api.response.badRequest(connection, "Id is not a valid ObjectID");
      return next(connection, true);
    }

    // Get papertrailId
    collection.findOne(selector, function(err, logger) {
      if (!err && logger) {
        papertrail.deleteLogger(api, logger.papertrailId)
          .then(deleteLogger)
          .then(respondOk)
          .fail(respondError)
          .done();
      } else if (!logger) {
        respondError("Logger not found");
      } else {
        respondError(err);
      }
    });

    function deleteLogger(papertrailId) {
      var deferred = Q.defer();
      var selector = { papertrailId: papertrailId };

      collection.findAndModify(selector, {}, {}, { remove: true }, deferred.makeNodeResolver());
      return deferred.promise;
    }

    function respondOk() {
      api.response.success(connection, "Logger deleted successfully");
      next(connection, true);
    }

    function respondError(err) {
      api.response.error(connection, err);
      next(connection, true);
    }
  }
};