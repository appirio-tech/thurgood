"use strict";
var angmodule = angular.module("thurgoodApp",['ui.bootstrap']);


angmodule.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'partials/home.partial.html',
			controller: 'HomeCtrl'
		})
		.when('/jobs', {
			templateUrl: 'partials/jobs.partial.html',
			controller: 'JobsListCtrl'
		})
		.when('/job/:id', {
			templateUrl: 'partials/job-detail.partial.html',
			controller: 'JobDetailCtrl'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);

//We already have a limitTo filter built-in to angular,
//let's make a startFrom filter
angmodule.filter('startFrom', function() {
    return function(input, start) {
    	if(!input) return [];
        start = +start; //parse to int
        //console.log(input);
        return input.slice(start);
    }
});