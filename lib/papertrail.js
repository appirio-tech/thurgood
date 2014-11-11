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
  var salt = process.env.PAPERTRAIL_DIST_SSO_SALT;
  var timestamp = parseInt(new Date().getTime() / 1000);
  var str = key + ":" + key + ":" + salt + ":" + timestamp;
  return  { token: sha1.update(str).digest('hex'), timestamp: timestamp };
}


// find an account with the accountId from the papertrail
// it returns promise.
//  - if found resolves with the found account
//  - if not, resolves with null
exports.findAccount = function(api, accountId) {
  var deferred = Q.defer();

  var options = { 
    url: api.configData.papertrail.accountsUrl + "/" + accountId, 
    auth: api.configData.papertrail.auth 
  };

  request.get(options, function (err, response, body) {
    if (err) {
      console.log("[Papertrail][Error] Get Account : ");
      console.log(err);
      return deferred.reject(err);
    }

    console.log("[Papertrail][DEBUG] Get Account : ", body);
    console.log('%%%%%');
	console.log(body);
	console.log('^^^^^^');
    // if account does not exist, it returns empty string
    if(body.trim().length == 0) {
      deferred.resolve(null);
    }
    else {
      var account = JSON.parse(body);
      deferred.resolve(account);      
    }
  });

  return deferred.promise; 
}


