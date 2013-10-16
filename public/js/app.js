/**
 * Angular config
 */
angular

// Modules used
.module('thurgood', [
  'ngResource',
  'ngRoute',
  'ngTable',
  'thurgoodControllers',
  'thurgoodServices',
  'thurgoodDirectives'
])

// Configure routes
.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/',         {templateUrl: '/views/pages/home.html'})
    .when('/jobs',     {templateUrl: '/views/pages/jobs.html',        controller: 'JobsCtrl', reloadOnSearch: false})
    .when('/jobs/:id', {templateUrl: '/views/pages/jobs-detail.html', controller: 'JobsDetailCtrl'})
    .when('/servers',  {templateUrl: '/views/pages/servers.html', controller: 'ServersCtrl', reloadOnSearch: false})
    .otherwise({redirectTo: '/'});
}]);
