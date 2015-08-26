var Promise = require("bluebird");
var crypto = require('crypto');
var winston = require('winston');
require('winston-papertrail').Papertrail;

module.exports = {

  log: function(text, sender) {

    var logger = new winston.Logger({
      transports: [
        new winston.transports.Papertrail({
          host: 'logs3.papertrailapp.com',
          port: parseInt(process.env.PAPERTRAIL_PORT),
          hostname: process.env.PAPERTRAIL_DIST_ACCOUNT,
          program: sender,
          colorize: true,
          logFormat: function(level, message) {
            return message;
          }
        })
      ]
     });
    logger.info(text);
  },

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
  },

}
