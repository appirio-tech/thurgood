exports.task = {
	name: "cleanLoggers",
	description: "Deletes loggers older than 90 days",
	scope: "any",
	frequency: 3 * 24 * 60 * 60 * 1000, // 3 days
	run: function(api, params, next) {
		var now = new Date().getTime();
		var period = 90 * 24 * 60 * 60 * 1000; // 90 days
		
		api.mongo.collections.loggers.remove({ updatedAt: { $lt: (now - period) } }, function(err, numberOfRemovedDocs) {
      if (!err) {
      	api.log("Removed " + numberOfRemovedDocs + " stale loggers", "notice");
      } else {
      	api.log(err, "error");
      }
    });

		next(null, true);
	}
};
