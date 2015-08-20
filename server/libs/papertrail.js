'use strict'

var Promise = require("bluebird");
var crypto = require('crypto');

module.exports = {

  token: function() {
    return new Promise(function(resolve, reject) {
      var sha1 = crypto.createHash('sha1');
      var salt = process.env.PAPERTRAIL_DIST_SSO_SALT;
      var timestamp = parseInt(new Date().getTime() / 1000);
      var str = process.env.PAPERTRAIL_DIST_ACCOUNT + ":" + process.env.PAPERTRAIL_DIST_ACCOUNT + ":" + salt + ":" + timestamp;
      var sso = {
        token: sha1.update(str).digest('hex'),
        timestamp: timestamp
      };
      resolve(sso);
    });
  }

}
