'use strict';


/**
 * Angular controllers
 */
var thurgood = angular.module('thurgood.Controllers', []);

/**
 * Controller for the top navigation bar
 */
thurgood.controller('NavCtrl', ['$scope', '$rootScope', '$location', '$cookies', 'LoopBackAuth', function($scope, $rootScope, $location, $cookies, LoopBackAuth){
    $rootScope.Shared = {};
    $scope.isLoggedIn = false;
    var api_token = $cookies.get('api_token');
    var api_userid = $cookies.get('api_userid');

    if(api_token && api_userid){
        $scope.name = $cookies.get('name');
        $scope.isLoggedIn = true;

        var api_userId = api_userid.split('"')[1]; //hack
        $rootScope.Shared.userId = api_userId;

        /**
         * Login into LoopBackAuth
         * After this we don't have to pass the access_token manually
         */
        LoopBackAuth.setUser(api_token, api_userId, {});
        LoopBackAuth.rememberMe = true;
        LoopBackAuth.save();
    }

    /**
     * Login Handler
     */
    $scope.login = function(){
        window.location.href = '/auth/google';
    };

    /**
     * Logout Handler
     */
    $scope.logout = function(){
        LoopBackAuth.clearStorage();
        LoopBackAuth.clearUser();
        window.location.href = '/auth/logout';
    };

}]);