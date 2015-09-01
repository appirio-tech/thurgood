'use strict';


/**
 * Controller for the Jobs page
 */
thurgood.controller('JobsCtrl', ['$scope', '$rootScope', '$http', '$location', 'Job', function($scope, $rootScope, $http, $location, Job) {
    if(!$rootScope.Shared.userId){
        $location.url('/');
        return;
    }

    $scope.Jobs = [];
    $scope.JobLoading = 'Loading...';

    /**
     * Get All Jobs
     */
    Job.find({}).$promise.then(function(data){
        $scope.JobLoading = 'No Jobs found!';
        for(var d = 0; d < data.length; d++){
            $scope.Jobs[d] = data[d];
            $scope.JobLoading = false;
        }
    }, function(err){
        console.log('Unable to get Jobs: ', err);
        $scope.JobLoading = 'Unable to get Jobs!';
    });

    /**
     * Create Job
     */
    $scope.createJob = function(){
        $location.url('job/create/new');
    };

    /**
     *
     * @param id {String} Job Id
     */
    $scope.showDetails = function(id){
        $location.url('job/view/' + id);
    };

    /**
     *
     * @param url {String} Code Url
     */
    $scope.downloadCode = function(url){
        window.open(url, '_blank');
    };

}]);