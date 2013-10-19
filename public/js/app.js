/**
 * Angular config
 */
angular

// Modules used
.module('thurgood', [
  'ngResource',
  'ngRoute',
  'ngTable',
  'ui.bootstrap',
  'ui.bootstrap.modal',
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
    .otherwise({redirectTo: '/'});
}]);
