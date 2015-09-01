'use strict';


/**
 * Angular config
 */
angular

/**
 * Modules used
 */
.module('thurgood', [
  'ngResource',
  'ngRoute',
  'ngCookies',
  'ngTable',
  'ui.bootstrap',
  'thurgood.Controllers',
  'lbServices',
  'thurgood.Directives'
])

/**
 * Constants
 */
.constant("config", {
      s3: {
        region: 'us-west-2',
        bucket: 'thurgood-manager',
        access_key: 'AKIAIZFIVCB37RKFG3GQ',
        secret_key: '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',
        max_file_size: 1000000000   // 1GB
      }
})

/**
 * Configure routes
 */
.config(['$routeProvider', function($routeProvider) {

  $routeProvider
    .when('/', {
      templateUrl: '/views/pages/home.html'
    })
    .when('/projects', {
      templateUrl: '/views/pages/projects.html',
      controller: 'ProjectsCtrl'
    })    
    .when('/project/:action/:id', {
      templateUrl: '/views/pages/project-details.html',
      controller: 'ProjectDetailsCtrl'
    })
    .when('/environments', {
      templateUrl: '/views/pages/environments.html',
      controller: 'EnvironmentsCtrl'
    })
    .when('/environment/:action/:id', {
      templateUrl: '/views/pages/environment-details.html',
      controller: 'EnvironmentDetailsCtrl'
    })
    .when('/jobs', {
      templateUrl: '/views/pages/jobs.html',
      controller: 'JobsCtrl'
    })
    .when('/job/:action/:id', {
      templateUrl: '/views/pages/job-details.html',
      controller: 'JobDetailsCtrl'
    })
    .otherwise({redirectTo: '/'});

}]);