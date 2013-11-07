var Q = require('q');
var request = require('request');
var crypto = require('crypto');

exports.createLogger = function(api, logger) {
  var deferred = Q.defer();

  api.mongo.collections.loggerAccounts.findOne({ _id: logger.loggerAccountId }, function(err, account) {
    if (!err && account) {
      var params = {
        id: logger.papertrailId,
        name: logger.name,
        account_id: account.papertrailId
      };

      request.post({ url: api.configData.papertrail.systemsUrl, form: params, auth: api.configData.papertrail.auth }, function(err, response, body) {
        if (err) {
          console.log("[Papertrail][FATAL] Create Logger Error: ");
          console.log(err);
          return deferred.reject(err);
        }

        body = JSON.parse(body);
        console.log("[Papertrail][DEBUG] ");
        console.log(body);

        if (body.message) {
          console.log("[Papertrail][FATAL] Create Logger Error: " + body.message);
          return deferred.reject(body.message);
        }

        console.log("[Papertrail][DEBUG] Create Logger Success: ");
        console.log(body);

        logger.syslogHostname = body.syslog_hostname;
        logger.syslogPort = body.syslog_port;

        deferred.resolve(logger);
      });
    } else if (!account) {
      return deferred.reject("Logger account not found");
    } else {
      return deferred.reject(err);
    }
  });

  return deferred.promise;
}

exports.deleteLogger = function(api, papertrailId) {
  var deferred = Q.defer();

  request.del({ url: api.configData.papertrail.systemsUrl + "/" + papertrailId, auth: api.configData.papertrail.auth }, function(err, response, body) {
    if (err) {
      console.log("[Papertrail][FATAL] Delete Logger Error: ");
      console.log(err);
      return deferred.reject(err);
    }

    // if papertrail returns a 404, don't throw an error
    if (response.statusCode == '404') {
      return deferred.resolve(papertrailId);
    } else {
      body = JSON.parse(body);
      // don't really care if papertrail throws any kind of error
      if (body.message) {
        console.log("[Papertrail][FATAL] Delete Logger Error: " + body.message);
      } else {
        console.log("[Papertrail][DEBUG] Delete Logger Success: ");
        console.log(body);
      } 
      deferred.resolve(papertrailId);      
    }

  });

  return deferred.promise;
}

// generates an SSO token for opening papertrail event viewer
exports.token = function(key) {
  var sha1 = crypto.createHash('sha1');
  var timestamp = parseInt(new Date().getTime() / 1000);
  var salt = process.env.PAPERTRAIL_DIST_SSO_SALT;
  var str = key + ":" + key + ":" + salt + ":" + timestamp;
  return  sha1.update(str).digest('hex');
}
