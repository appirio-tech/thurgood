var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;

exports.task = {
  name: "cleanLoggers",
  description: "Deletes loggers older than 90 days",
  scope: "any",
  frequency: 3 * 24 * 60 * 60 * 1000, // 3 days
  run: function(api, params, next) {
    var now = new Date().getTime();
    var period = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    // Find old loggers and delete them from database and Papertrail
    api.mongo.collections.loggers.find({ updatedAt: { $lt: (now - period) } }, function(err, docs) {
      if (!err) {
        _.each(docs, function(doc) {
          // Call DELETE /loggers/:id endpoint
        });
      } else {
        api.log(err, "error");
      }
    });

    next(null, true);
  }
};
