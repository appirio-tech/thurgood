'use strict';

var ctrlModule = angular.module('thurgoodApp.controllers', []);

angular.module('thurgoodApp', [
  'thurgoodApp.controllers',
  'thurgoodApp.filters',
  'thurgoodApp.services',
  'thurgoodApp.directives',
  'ngTable'
]).

config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {templateUrl: 'partials/home.html', controller: "HomeCtrl"}).
    when('/jobs', {templateUrl: 'partials/jobs.html', controller: "JobsCtrl"}).
    otherwise({
      redirectTo: '/'
    });

  // $locationProvider.html5Mode(true);
});
