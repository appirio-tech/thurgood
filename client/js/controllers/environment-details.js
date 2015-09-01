'use strict';


/**
* Controller for an Environment's detail page
*/
thurgood.controller('EnvironmentDetailsCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$timeout', 'Environment', function($scope, $rootScope, $routeParams, $location, $timeout, Environment) {
    if(!$rootScope.Shared.userId){
        $location.url('/');
        return;
    }

    $scope.environmentId = $routeParams.id;
    $scope.action = $routeParams.action;
    $scope.Environment = {};

    /**
     * Get Environment By Id
     */
    if($scope.action == 'view' || $scope.action == 'edit'){
        Environment.findById({ id: $scope.environmentId }).$promise.then(function(data){
            $scope.Environment = data;
        }, function(err){
            console.log('Unable to get Environment: ', err);
            $location.url('environments');
        });
    }

    /**
     * @param environmentId {String} Environment Id
     */
    $scope.editEnvironment = function(environmentId){
        $location.url('environment/edit/' + environmentId);
    };

    /**
     *
     * @param className {String} success/danger
     * @param msg   {String} Message to be displayed
     * @param time  {Number} In milliseconds
     */
    $scope.alert = function(className, msg, time){
        $rootScope.Shared.alertShow = true;
        $rootScope.Shared.alertClass = 'alert-' + className;
        $rootScope.Shared.alertMsg = msg;

        $timeout(function(){
            $rootScope.Shared.alertShow = false;
        }, time || 3000);
    };

    /**
     * Back Button
     */
    $scope.back = function(){
        history.back();
    };

    /**
     * Select Initializer
     */
    if(!$scope.Environment.type){
        $scope.Environment.type = 'other';
    }

    if(!$scope.Environment.status){
        $scope.Environment.status = 'available';
    }

    /**
     *
     * @param environment {Object} The Environment Object
     */
    $scope.saveEnvironment = function(environment){
        environment.updatedAt = new Date();
        if($scope.action == 'create'){
            environment.createdAt = new Date();
        }

        Environment.upsert(environment).$promise.then(function(data){
            $scope.alert('success', 'Environment saved successfully!');
            $location.url('environment/view/' + data.id);
        }, function(err){
            $scope.alert('danger', err.data.error.message || 'Unable to save the Environment!', 10000);
        });
    };

    /**
     * Cancel Creating/Editing Environment
     */
    $scope.cancelEnvironment = function(){
        if($scope.action == 'edit'){
            $location.url('environment/view/' + $scope.environmentId);
        }else{
            $location.url('environments');
        }
    }

}]);