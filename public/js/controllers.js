/**
 * Angular controllers
 */
var thurgood = angular.module('thurgoodControllers', []);

/**
 * Controller for the top navigation bar
 */
thurgood.controller('NavCtrl', ['$scope', '$location', function($scope, $location) {
  // Check if loc matches the current location
  $scope.isActive = function(loc) {
    return loc == $location.path();
  };
}]);

/**
 * Controller for the Jobs page
 */
thurgood.controller('JobsCtrl', ['$scope', '$filter', '$location', '$modal', 'Jobs', 'ngTableParams', function($scope, $filter, $location, $modal, Jobs, ngTableParams) {
  var promise = Jobs.query().$promise;
  $scope.loading = true;
  $scope.submitStatus = {};

  // Handle errors
  var errorHandler = function(err) {
    $scope.loading = false;
    $scope.error = (err.data && err.data.error) || err.error || err.message || "Unknown error. Please contact developer.";
  };

  // Show job creation modal
  $scope.createModal = function () {
    $modal.open({
      templateUrl: 'jobsCreateModal',
      controller: function($scope, $modalInstance) {
        $scope.job = {};
        $scope.timestamp = new Date().getTime();

        // Change server error messages to user friendly strings
        var translateError = function(err) {
          if (err == 'Error: email is a required parameter for this action')    return 'User Email is required';
          if (err == 'Error: platform is a required parameter for this action') return 'Platform is required';
          if (err == 'Error: language is a required parameter for this action') return 'Language is required';
          if (err == 'Error: userId is a required parameter for this action')   return 'User ID is required';
          if (err == 'Error: codeUrl is a required parameter for this action')  return 'Code URL is required';
          if (err == 'Parameter loggerId is not a valid ObjectID')              return 'Invalid logger ID';
          if (err == 'Parameter options is not a valid JSON object')            return 'Invalid options: must be a valid JSON object';
          return err;
        };

        // Handle api errors
        var errorHandler = function(err) {
          var error = (err.data && err.data.error) || err.error || err.message || "Unknown error. Please contact developer.";
          $scope.status = translateError(error);
        };

        // Create job
        $scope.create = function () {
          // Ignore click if request is already pending
          if ($scope.status == 'Creating job...') {
            return;
          }

          // Display current status
          $scope.status = 'Creating job...';
          $scope.uploadWarning = undefined;

          // Clean empty fields so that they aren't sent resulting in invalid parameter errors
          angular.forEach(Object.keys($scope.job), function(key) {
            if (!$scope.job[key]) {
              delete $scope.job[key];
            }
          });

          // Create resource and POST it
          var job = new Jobs($scope.job);
          job.$save(function(res) {
            if (res.success != true) {
              errorHandler(res);
              return;
            }

            $scope.jobId = res.data[0]._id;
            $scope.status = 'SUCCESS';
          }, errorHandler);
        };
        
        // Dismiss modal
        $scope.cancel = function () {
          $modalInstance.dismiss();
        };

        // Upload file
        $scope.fileNameChanged = function(file) {
          document.getElementById("s3UploadForm").submit();
          var url = 'https://s3-us-west-2.amazonaws.com/cs-thurgood-jobsupload/thurgood/' + $scope.timestamp + '-' + file.name;
          $scope.job.codeUrl = url;
          $scope.uploadWarning = 'Note: please make sure the file has finished uploading before pressing Create!';
          $scope.$apply();
        };
      }
    });
  };

  // Submit job
  $scope.submitJob = function(_id) {
    var errorHandler = function(err) {
      var error = (err.data && err.data.error) || err.error || err.message || "Error";
      if (error == 'Could not find any available servers. Try again in a few minutes') {
        error = 'No servers available';
      }

      $scope.submitStatus[_id] = error;
      
      setTimeout(function() {
        if ($scope.submitStatus[_id] == 'Error') {
          $scope.submitStatus[_id] = undefined;
        }
      }, 2000);
    };

    $scope.submitStatus[_id] = 'Submitting...';
    
    new Jobs({id: _id}).$submit(function(res) {
      if (res.success != true) {
        errorHandler(res);
        return;
      }

      $scope.submitStatus[_id] = 'Submitted';
    }, errorHandler);
  }

  // API request successful
  promise.then(function(res) {
    if (res.success != true) {
      errorHandler(res);
      return;
    }

    var searchedData = res.data;
    $scope.loading = false;
    $scope.totalItems = res.data.length;
    $scope.error = undefined;

    // Format dates
    for (i = 0; i < res.data.length; i++) {
      res.data[i].updatedAt = new Date(res.data[i].updatedAt).toISOString();
    }

    // Setup ngTable
    $scope.tableParams = new ngTableParams(
      // Merge default params with url
      angular.extend({
        page: 1,
        total: res.data.length,
        count: 10,
        sorting: {updatedAt: 'desc'}
      },
      $location.search())
    );

    // Watch for changes of the table parameters
    $scope.$watch('tableParams', function(params) {
      // Put params in url
      $location.search(
        angular.extend({
          page: 1,
          total: res.data.length,
          count: 10,
          sorting: {updatedAt: 'desc'}
        },
        params.url())
      );

      // Use built-in angular filter
      var orderedData = params.sorting ? $filter('orderBy')(searchedData, params.orderBy()) : searchedData;

      // Slice array data on pages
      $scope.tableRows = orderedData.slice(
        (params.page - 1) * params.count,
        params.page * params.count
      );
    }, true);

    // Watch for changes of the search input value
    var searchTextWatcher = function(searchText) {
      if (searchText === undefined)
        return;

      // Put query in url
      $location.search(
        angular.extend({
          page: 1,
          total: res.data.length,
          count: 10,
          sorting: {updatedAt: 'desc'}
        },
        {search: searchText})
      );

      // Use built-in angular filter
      searchedData = $filter('filter')(res.data, searchText);

      // Update table params
      $scope.tableParams.page = 1;
      $scope.tableParams.total= searchedData.length;
    };

    // Set watcher
    $scope.$watch('searchText', searchTextWatcher, true);

    // Load last search
    $scope.searchText = $location.search().search;
    searchTextWatcher($scope.searchText);
  });

  // API request error
  promise.catch(errorHandler);
}]);

/**
 * Controller for a job's detail page
 */
thurgood.controller('JobsDetailCtrl', ['$scope', '$location', '$modal', 'Jobs', function($scope, $location, $modal, Jobs) {
  var jobId = $location.path().substring(6);
  var promise = Jobs.get({id: jobId}).$promise;
  $scope.jobId = jobId;
  $scope.loading = true;

  // Change server error messages to user friendly strings
  var translateError = function(err) {
    if (err == 'Id is not a valid ObjectID') return 'Invalid job id';
    return err;
  };

  // Handle errors
  var errorHandler = function(err) {
    $scope.loading = false;
    var error = (err.data && err.data.error) || err.error || err.message || "Unknown error. Please contact developer.";
    $scope.error = translateError(error);
  };

  // API request successful
  promise.then(function(res) {
    if (res.success != true) {
      errorHandler(res);
      return;
    }

    // Show job edit modal
    var detailScope = $scope;
    $scope.editModal = function () {
      $modal.open({
        templateUrl: 'jobsEditModal',
        controller: function($scope, $modalInstance) {
          $scope.job = {};
          $scope.job.id = res.data[0]._id;

          // Move updateable values in a new object
          angular.forEach(res.data[0], function(value, key) {
            if (value && ['email', 'platform', 'language', 'userId', 'codeUrl', 'loggerId', 'options'].indexOf(key) > -1) {
              this[key] = value;
            }
          }, $scope.job);

          // Change server error messages to user friendly strings
          var translateError = function(err) {
            if (err == 'Error: email is a required parameter for this action')    return 'User Email is required';
            if (err == 'Error: platform is a required parameter for this action') return 'Platform is required';
            if (err == 'Error: language is a required parameter for this action') return 'Language is required';
            if (err == 'Error: userId is a required parameter for this action')   return 'User ID is required';
            if (err == 'Error: codeUrl is a required parameter for this action')  return 'Code URL is required';
            if (err == 'Parameter loggerId is not a valid ObjectID')              return 'Invalid logger ID';
            if (err == 'Parameter options is not a valid JSON object')            return 'Invalid options: must be a valid JSON object';
            return err;
          };

          // Handle api errors
          var errorHandler = function(err) {
            var error = (err.data && err.data.error) || err.error || err.message || "Unknown error. Please contact developer.";
            $scope.status = translateError(error);
          };

          // Update job
          $scope.update = function () {
            // Ignore click if request is already pending
            if ($scope.status == 'Updating job...') {
              return;
            }

            // Display current status
            $scope.status = 'Updating job...';
            $scope.uploadWarning = undefined;

            // Clean empty fields so that they aren't sent resulting in invalid parameter errors
            angular.forEach(Object.keys($scope.job), function(key) {
              if (!$scope.job[key]) {
                delete $scope.job[key];
              }
            });

            // Create resource and POST it
            var jobRes = new Jobs($scope.job);
            jobRes.$update(function(res) {
              if (res.success != true) {
                errorHandler(res);
                return;
              }

              // Format fields
              var job = res.data;
              job.createdAt = job.createdAt ? new Date(job.createdAt).toISOString() : 'null';
              job.updatedAt = job.updatedAt ? new Date(job.updatedAt).toISOString() : 'null';
              job.startTime = job.startTime ? new Date(job.startTime).toISOString() : 'null';
              job.endTime = job.endTime ? new Date(job.endTime).toISOString() : 'null';
              job.options = job.options ? JSON.stringify(job.options) : 'null';

              // Replace empty fields with null
              angular.forEach(job, function(value, key) {
                job[key] = value ? value : 'null';
              });
              
              detailScope.job = job;
              $scope.status = 'SUCCESS';
            }, errorHandler);
          };
          
          // Dismiss modal
          $scope.cancel = function () {
            $modalInstance.dismiss();
          };

          // Upload file
          $scope.fileNameChanged = function(file) {
            document.getElementById("s3UploadForm").submit();
            var url = 'https://s3-us-west-2.amazonaws.com/cs-thurgood-jobsupload/thurgood/' + $scope.job.id + '-' + file.name;
            $scope.job.codeUrl = detailScope.job.codeUrl = url;
            $scope.uploadWarning = 'Note: please make sure the file has finished uploading before pressing Upload!';
            $scope.$apply();
          };
        }
      });
    };

    // Format fields
    var job = res.data[0];
    job.createdAt = job.createdAt ? new Date(job.createdAt).toISOString() : 'null';
    job.updatedAt = job.updatedAt ? new Date(job.updatedAt).toISOString() : 'null';
    job.startTime = job.startTime ? new Date(job.startTime).toISOString() : 'null';
    job.endTime = job.endTime ? new Date(job.endTime).toISOString() : 'null';
    job.options = job.options ? JSON.stringify(job.options) : 'null';

    // Replace empty fields with null
    angular.forEach(job, function(value, key) {
      job[key] = value ? value : 'null';
    });

    $scope.loading = false;
    $scope.job = job;
    $scope.error = undefined;
  });

  // API request error
  promise.catch(errorHandler);
}]);
