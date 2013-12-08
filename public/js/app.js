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
  var access = routingConfig.accessLevels;

  $routeProvider
    .when('/', {
      templateUrl: '/views/pages/home.html',
      access: access.public
    })
    .when('/jobs', {
      templateUrl: '/views/pages/jobs.html',
      controller: 'JobsCtrl',
      reloadOnSearch: false,
      access: access.user
    })
    .when('/jobs/:id', {
      templateUrl: '/views/pages/jobs-detail.html',
      controller: 'JobsDetailCtrl',
      access: access.user
    })
    .when('/jobs/:id/events', {
      templateUrl: '/views/pages/jobs-events.html',
      controller: 'JobsEventsCtrl',
      access: access.public
    })    
    .when('/servers', {
      templateUrl: '/views/pages/servers.html',
      controller: 'ServersCtrl',
      reloadOnSearch: false,
      access: access.admin
    })
    .when('/server/create', {
      templateUrl: '/views/pages/server-create.html',
      controller: 'ServerCreateCtrl',
      access: access.admin
    })
    .when('/server/:id', {
      templateUrl: '/views/pages/server-maintain.html',
      controller: 'ServerMaintainCtrl',
      access: access.admin
    })
    .otherwise({redirectTo: '/'});
}])

.run(['$rootScope', '$location', 'Auth', function ($rootScope, $location, Auth) {

  Auth.getCurrentUser();

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
      $rootScope.error = null;
      if(!Auth.isAccessible(next.access)) {
        $location.path('/');
      }
  });

}]);
