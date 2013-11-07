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
    api.mongo.collections.loggerSystems.find({ updatedAt: { $lt: (now - period) } }).toArray(function(err, docs) {
      if (!err) {
        var loggerConnection = new api.connection({ type: 'task', remotePort: '0', remoteIP: '0', rawConnection: {req: { headers: {authorization: "Token token=" + process.env.THIS_API_KEY}}}});
        _.each(docs, function(doc) { 
          var loggerId = doc._id.toString();
          loggerConnection.params = { action: "loggersDelete", apiVersion: 1, id: loggerId };
          // call the endpoint to delete the logger
          var actionProcessor = new api.actionProcessor({connection: loggerConnection, callback: function(internalConnection, cont) {
            if (internalConnection.error) {
              console.log("Error deleting logger " + loggerId + ": " + internalConnection.error);
            } else {
              console.log(internalConnection.response.message + ": " + loggerId); 
            }
          }});
          actionProcessor.processAction();  
        });
      } else {
        console.log("[FATAL] Error cleaning loggers: " + err);
      }
    });

    next(null, true);
  }
};
