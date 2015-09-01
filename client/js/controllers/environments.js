'use strict';


/**
 * Controller for the Environments page
 */
thurgood.controller('EnvironmentsCtrl', ['$scope', '$rootScope', '$http', '$location', 'Environment', function($scope, $rootScope, $http, $location, Environment) {
    if(!$rootScope.Shared.userId){
        $location.url('/');
        return;
    }

    $scope.Environments = [];
    $scope.EnvironmentsLoading = 'Loading...';

    /**
     * Get all Environments
     */
    Environment.find({}).$promise.then(function(data){
        $scope.EnvironmentsLoading = 'No Environments found!';
        for(var d = 0; d < data.length; d++){
            $scope.Environments[d] = data[d];
            $scope.EnvironmentsLoading = false;
        }
    }, function(err){
        console.log('Unable to get Environments: ', err);
        $scope.EnvironmentsLoading = 'Unable to get Environments!';
    });

    /**
     * Create Environment
     */
    $scope.createEnvironment = function(){
        $location.url('environment/create/new');
    };

    /**
     *
     * @param id {String} Environment Id
     */
    $scope.showDetails = function(id){
        $location.url('environment/view/' + id);
    }

}]);