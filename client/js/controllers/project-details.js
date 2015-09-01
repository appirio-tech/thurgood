'use strict';


/**
* Controller for a Project's detail page
*/
thurgood.controller('ProjectDetailsCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$timeout', 'Project', function($scope, $rootScope, $routeParams, $location, $timeout, Project) {
    if(!$rootScope.Shared.userId){
        $location.url('/');
        return;
    }

    $scope.projectId = $routeParams.id;
    $scope.action = $routeParams.action;
    $scope.Project = {};

    /**
     * Get Project Details by Id
     */
    if($scope.action == 'view' || $scope.action == 'edit'){
        Project.findById({ id: $scope.projectId }).$promise.then(function(data){
            $scope.Project = data;
        }, function(err){
            console.log('Unable to get Project: ', err);
            $location.url('projects');
        });
    }

    /**
     *
     * @param projectId {String} Project Id
     */
    $scope.editProject = function(projectId){
        $location.url('project/edit/' + projectId);
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
     * Back Button Handler
     */
    $scope.back = function(){
        history.back();
    };

    /**
     *
     * @param project {Object} The Project Object
     */
    $scope.saveProject = function(project){
        project.userId = $rootScope.Shared.userId;
        project.updatedAt = new Date();

        if($scope.action == 'create'){
            project.createdAt = new Date();
        }

        /**
         * Create / Update Project
         */
        Project.upsert(project).$promise.then(function(data){
            $scope.alert('success', 'Project saved successfully!');
            $location.url('project/view/' + data.id);
        }, function(err){
            $scope.alert('danger', err.data.error.message || 'Unable to save the Project!', 10000);
        });
    };

    /**
     * Cancel Project Create / Edit
     */
    $scope.cancelProject = function(){
        if($scope.action == 'edit'){
            $location.url('project/view/' + $scope.projectId);
        }else{
            $location.url('projects');
        }
    }

}]);