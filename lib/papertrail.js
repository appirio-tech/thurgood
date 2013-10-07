var request = require('request');
var Q = require("q");
var Errors = require("./errors");

exports.createLogger = function(auth, logger) {
  var deferred = Q.defer();

  var params = {
    id: logger.papertrailId,
    name: logger.name,
    account_id: logger.papertrailAccountId
  };

  // Create Papertrail logger
  console.log("[Papertrail]", "Create Logger with params", params);

  var url = process.env.PAPERTRAIL_DIST_URL + "/systems";
  request.post({url: url, form: params, auth: auth }, function(err, response, body) {
    if (err) {
      console.log("  [Papertrail]", "Create Logger Error : ", err);
      return deferred.reject(err);
    }

    body = JSON.parse(body);
    console.log("  [Papertrail] debug", body);

    if(body.message) {
      console.log("  [Papertrail]", "Create Logger Error : ", body.message);
      return deferred.reject(new Errors.BadRequestError("Papertrail : " + body.message));      
    }

    console.log("  [Papertrail]", "Create Logger Success : ", body);

    logger.syslogHostname = body.syslog_hostname;
    logger.syslogPort = body.syslog_port;

    deferred.resolve(logger);
  });

  return deferred.promise;
}

exports.deleteLogger = function(auth, papertrailId) {
  var deferred = Q.defer();

  // Create Papertrail logger
  console.log("[Papertrail]", "Delete Logger of", papertrailId);

  var url = process.env.PAPERTRAIL_DIST_URL + "/systems/" + papertrailId;
  request.del({url: url, auth: auth }, function(err, response, body) {
    if (err) {
      console.log("  [Papertrail]", "Delete Logger Error : ", err);
      return deferred.reject(err);
    }

    body = JSON.parse(body);

    if(body.message) {
      console.log("  [Papertrail]", "Delete Logger Error : ", body.message);
      return deferred.reject(new Errors.BadRequestError("Papertrail : " + body.message));      
    }

    console.log("  [Papertrail]", "Delete Logger Success : ", body);

    deferred.resolve(papertrailId);
  });

  return deferred.promise;
}