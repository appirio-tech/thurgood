'use strict';


/**
* Controller for a Job's detail page
*/
thurgood.controller('JobDetailsCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$timeout', 'config', 'Job', function($scope, $rootScope, $routeParams, $location, $timeout, config, Job) {
    if(!$rootScope.Shared.userId){
        $location.url('/');
        return;
    }

    $scope.jobId = $routeParams.id;
    $scope.action = $routeParams.action;
    $scope.Job = {};

    /**
     * Get Job by Id
     */
    if($scope.action == 'view' || $scope.action == 'edit'){
        Job.findById({ id: $scope.jobId }).$promise.then(function(data){
            $scope.Job = data;
        }, function(err){
            console.log('Unable to get Job: ', err);
            $location.url('jobs');
        });
    }

    /**
     *
     * @param jobId {String} Job Id
     */
    $scope.editJob = function(jobId){
        $location.url('job/edit/' + jobId);
    };

    /**
     *
     * @param url {String} Code Url
     */
    $scope.downloadCode = function(url){
        window.open(url, '_blank');
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
     *
     * @param job {Object} Job Object
     */
    $scope.saveJob = function(job){
        job.userId = $rootScope.Shared.userId;
        job.updatedAt = new Date();

        if($scope.action == 'create'){
            job.createdAt = new Date();
        }

        /**
         * Create or Update Job
         */
        Job.upsert(job).$promise.then(function(data){
            $scope.alert('success', 'Job saved successfully!');
            $location.url('job/view/' + data.id);
        }, function(err){
            $scope.alert('danger', err.data.error.message || 'Unable to save the Job!', 10000);
        });
    };

    /**
     * Cancel Job
     */
    $scope.cancelJob = function(){
        if($scope.action == 'edit'){
            $location.url('job/view/' + $scope.jobId);
        }else{
            $location.url('jobs');
        }
    };

    /**
     * Select Initialiser
     */
    if(!$scope.Job.status){
        $scope.Job.status = 'created';
    }

    if(!$scope.Job.type){
        $scope.Job.type = 'other';
    }

    if(!$scope.Job.notification){
        $scope.Job.notification = 'email';
    }

    if(!$scope.Job.steps){
        $scope.Job.steps = 'scan';
    }


    /**
     * Amazon S3 Upload Credentials
     */
    $scope.creds = config.s3;

    /**
     * Fake Upload File Button
     */
    $scope.uploadFile = function(){
        $('#file').click();
    };

    /**
     *
     * @param file {Object} The File Object
     */
    $scope.percent = null;
    $scope.upload = function(file) {
        // Configure The S3 Object
        AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
        AWS.config.region = $scope.creds.region;
        var bucket = new AWS.S3({ params: { Bucket: $scope.creds.bucket } });
        var url = 'https://s3-'+ $scope.creds.region +'.amazonaws.com/'+ $scope.creds.bucket +'/'+file.name;

        if(file) {
            if(file.size > $scope.creds.max_file_size){
                $scope.alert('danger', 'No file selected!');
                return false;
            }

            var params = { Key: file.name, ContentType: file.type, Body: file };

            /**
             * Put into S3 bucket
             */
            bucket.putObject(params, function(err, data) {
                if(err) {
                    $scope.alert('danger', 'Unable to upload file!', 5000);
                    $scope.percent = null;
                    $scope.Job.codeUrl = '';
                    return false;
                }else{
                    $scope.alert('success', 'File uploaded successfully!');
                    $scope.percent = null;
                    $scope.Job.codeUrl = url;
                }
                $scope.$apply();
            }).on('httpUploadProgress',function(progress) {
                var pp = Math.round(progress.loaded / progress.total * 100);
                $scope.percent = pp + '%';
                $scope.$apply();
            });
        }else{
            $scope.alert('warning', 'No file selected!');
            $scope.$apply();
        }
    };

    /**
     *
     * @param jobId {String} Job Id
     */
    $scope.submittingJob = false;
    $scope.submitJob = function(jobId){
        $scope.submittingJob = true;
        Job.submit({ "id": jobId }).$promise.then(function(data){
            $scope.alert('success', 'Job submitted successfully!');
            $scope.submittingJob = false;
        }, function(err){
            console.log('error', err);
            $scope.alert('danger', err.data.error.message || 'Unable to submit the Job!', 10000);
            $scope.submittingJob = false;
        });
    };

    /**
     * Redirect to Papertrail
     */
    $scope.token = {};
    $scope.eventViewer = function(){
        window.location.href = 'https://papertrailapp.com/events';
    };

}]);