var ThurgoodApp = angular.module('ThurgoodApp', ['ngGrid']);
ThurgoodApp.config(['$routeProvider', function ($routeProvider) {
	$routeProvider.when('/jobs', {
		templateUrl: 'views/jobs.html',
		controller: 'JobsCtrl'
	});

	$routeProvider.otherwise({
		redirectTo: '/jobs'
	});
}]);