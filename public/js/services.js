'use strict';

angmodule.factory('ThurgoodProxy', ['$http', function ($http) {
	return {
		//get list of all jobs
		getJobsList: function (callbackSuccess, callbackError) {
			$http.get('/api/1/jobs')
				.success(
					function(data, status, headers, config) {
						callbackSuccess(data);
					})
				.error(function(data, status, headers, config) {
						callbackError(data);
					});
		},
		//get job by id
		getJobById: function (id,callbackSuccess, callbackError) {
			$http.get('/api/1/jobs/'+id)
				.success(
					function(data, status, headers, config) {
						callbackSuccess(data);
					})
				.error(function(data, status, headers, config) {
						callbackError(data);
					});
		},
	};
}]);
