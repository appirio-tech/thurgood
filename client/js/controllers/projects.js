'use strict';


/**
 * Controller for the Projects page
 */
thurgood.controller('ProjectsCtrl', ['$scope', '$rootScope', '$http', '$location', 'Project', function($scope, $rootScope, $http, $location, Project) {
    if(!$rootScope.Shared.userId){
        $location.url('/');
        return;
    }

    $scope.Projects = [];
    $scope.ProjectLoading = 'Loading...';

    /**
     * Get All Projects
     */
    Project.find({}).$promise.then(function(data){
        $scope.ProjectLoading = 'No Projects found!';
        for(var d = 0; d < data.length; d++){
            $scope.Projects[d] = data[d];
            $scope.ProjectLoading = false;
        }
    }, function(err){
        console.log('Unable to get Projects: ', err);
        $scope.ProjectLoading = 'Unable to get Projects!';
    });

    /**
     * Create New Project
     */
    $scope.createProject = function(){
        $location.url('project/create/new');
    };

    /**
     *
     * @param id {String} Project Id
     */
    $scope.showDetails = function(id){
        $location.url('project/view/' + id);
    }

}]);