/**
 * Angular controllers
 */
var thurgood = angular.module('thurgoodControllers', []);

/**
 * Controller for the top navigation bar
 */
thurgood.controller('NavCtrl', ['$scope', '$location', '$http', 'Auth', function($scope, $location, $http, Auth) {

  // Check if loc matches the current location
  $scope.isActive = function(loc) {
    return loc == $location.path();
  };

  $scope.loginText = function() {
    return Auth.isLoggedIn() ? "LOGOUT" : "LOGIN";
  };

  $scope.loginOrLogout = function() {
    if(Auth.isLoggedIn()) {
      Auth.logout();
    }
    else {
      Auth.googleLogin();
    }
  }

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
    $scope.error = (err.data && err.data.error) || err.error || err.message || "Unknown error. Please contact support.";
  };

  // Show job creation modal
  $scope.createModal = function () {
    $modal.open({
      templateUrl: 'jobsCreateModal',
      controller: function($scope, $modalInstance) {
        $scope.job = {email: $scope.user.email, steps: 'all'};
        $scope.timestamp = new Date().getTime();

        $scope.platforms = ["other","salesforce.com", "heroku"];  
        $scope.languages = ["apex", "java"];
        $scope.steps = ["all", "scan"];  
        $scope.notifications = ["email"];

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
          var error = (err.data && err.data.error) || err.error || err.message || "Unknown error. Please contact support.";
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
            $scope.jobId = res.data._id;
            $scope.status = 'SUCCESS';
            $modalInstance.dismiss();
            $location.path('/jobs/' + res.data._id);
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
thurgood.controller('JobsDetailCtrl', ['$scope', '$routeParams', '$modal', 'Jobs', 'Pt', function($scope, $routeParams, $modal, Jobs, Pt) {
  var jobId = $routeParams.id;
  var job = {};
  $scope.jobId = jobId;
  $scope.loading = true;  

 // Submit job
  $scope.submitJob = function() {
    new Jobs({id: jobId}).$submit(function(res) {
      if (res.success != true) {
        submitErrorHandler(res);
        return;
      } else {
          // show the new status before the page refresh
          job.status = 'submitted';
          job.endTime = null;        
          alert('Your job has been submitted for processing. See the Event Viewer for progress. ');
      }
    }, submitErrorHandler);
  }  

  var submitErrorHandler = function(err) {
    console.log(err);
    var error = (err.data && err.data.error) || err.error || err.message || "Error";
    alert(error);
  };  

  // Change server error messages to user friendly strings
  var translateError = function(err) {
    if (err == 'Id is not a valid ObjectID') return 'Invalid job id';
    return err;
  };

  // Handle errors
  var errorHandler = function(err) {
    $scope.loading = false;
    var error = (err.data && err.data.error) || err.error || err.message || "Unknown error. Please contact support.";
    $scope.error = translateError(error);
  };

  //  fetch the job promise
  var jobPromise = Jobs.get({id: jobId}).$promise;
    // chain the token as a promise
  var tokenPromise = jobPromise.then(function(res) {
    if (res.success === false) {
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
          $scope.platforms = ["other","salesforce.com", "heroku"];  
          $scope.languages = ["apex", "java"];  
          $scope.steps = ["all", "scan"];  
          $scope.notifications = ["email"];

          // Move updateable values in a new object
          angular.forEach(res.data[0], function(value, key) {
            if (value && value != 'null' && ['email', 'platform', 'language', 'userId', 'codeUrl', 'loggerId', 'options', 'steps', 'notification', 'project'].indexOf(key) > -1) {
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
            if (err == 'Error: steps is a required parameter for this action')  return 'Steps is required';
            if (err == 'Error: notification is a required parameter for this action')  return 'Email Notify is required';
            if (err == 'Parameter loggerId is not a valid ObjectID')              return 'Invalid logger ID';
            if (err == 'Parameter options is not a valid JSON object')            return 'Invalid options: must be a valid JSON object';
            return err;
          };

          // Handle api errors
          var errorHandler = function(err) {
            var error = (err.data && err.data.error) || err.error || err.message || "Unknown error. Please contact support.";
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

            // if they are erasing the project name then pass "null" so the controller will null it
            if (detailScope.job.project != undefined && $scope.job.project === undefined) {
              $scope.job.project = "null";
            }

            // Create resource and PUT it
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
              $modalInstance.dismiss();
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
    job = res.data[0];
    job.createdAt = job.createdAt ? new Date(job.createdAt).toISOString() : 'null';
    job.updatedAt = job.updatedAt ? new Date(job.updatedAt).toISOString() : 'null';
    job.startTime = job.startTime ? new Date(job.startTime).toISOString() : 'null';
    job.endTime = job.endTime ? new Date(job.endTime).toISOString() : 'null';
    job.options = job.options ? JSON.stringify(job.options) : 'null';

    // Replace empty fields with null
    angular.forEach(job, function(value, key) {
      job[key] = value ? value : 'null';
    });
    $scope.job = job;

    // return the token promise
    return Pt.get({key: res.data[0].userId}).$promise;
  });    

  tokenPromise.then(function(res) {
    if (res.success === false) {
      errorHandler(res);
      return;
    }
    $scope.error = undefined;
    $scope.loading = false;
    $scope.timestamp = parseInt(new Date().getTime() / 1000);    
    $scope.token = res.message;
    $scope.distributor = "CloudSpokes";
  });

  // // API request error
  jobPromise.catch(errorHandler);
  tokenPromise.catch(errorHandler);
}]);

/**
 * Controller for the Servers page
 */
thurgood.controller('ServersCtrl', ['$scope', '$filter', '$location', 'Servers', 'ngTableParams', function($scope, $filter, $location, Servers, ngTableParams) {
  var promise = Servers.query().$promise;
  $scope.loading = true;

  // Handle errors
  var errorHandler = function(err) {
    $scope.loading = false;
    $scope.error = err.data.error || err.error || err.message || "Unknown error. Please contact support.";
  };

  // API request successful
  promise.then(function(res) {
    if (res.success === false) {
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

  //Convert the array to string where entries are seperated by a comma
  $scope.getStringFromArray = function (arrayParam) {
    var stringOutput = '';

    if (!angular.isArray(arrayParam)) {
      return arrayParam;
    }

    for (var i = 0; i < arrayParam.length; i++) {
      if (stringOutput !== '') {
        stringOutput = stringOutput + ", ";
      }

      stringOutput = stringOutput + arrayParam[i];
    }

    return stringOutput;
  };

  //Change the path to allow creation of server
  $scope.createServer = function () {
    $location.path('/server/create');
  };

  //Display the details of the server
  $scope.displayServerDetails = function (serverId) {
    $location.path('/server/' + serverId);
    $location.search("");
    $location.hash("");
  };
}]);

/**
 * Controller for the Server Create page
 */
thurgood.controller('ServerCreateCtrl', ['$scope', '$timeout', 'Servers', function ($scope, $timeout, Servers) {
  'use strict';

  $scope.newServerData = {
    installedServices: [],
    instanceUrl: "",
    jobId: null,
    languages: [],
    name: "",
    operatingSystem: null,
    password: null,
    platform: null,
    repoName: null,
    status: "available",
    username: null
  };

  $scope.creationSuccess = false;

  $scope.creationError = false;

  $scope.newRecordId = null;

  //Create the new server record
  $scope.createServer = function () {
    //Ensure mandatory fields are provided
    if ($scope.newServerData.name === "") {
      return;
    }

    var newRecord = JSON.parse(JSON.stringify($scope.newServerData));
    newRecord.installedServices = JSON.stringify(newRecord.installedServices);
    newRecord.languages = JSON.stringify(newRecord.languages);

    var record = new Servers(newRecord);

    record.$save(function (res) {
      if (!res.success) {
        $scope.creationError = true;

        $timeout(function () {
          $scope.creationError = false;
        }, 3000);
      } else {
        $scope.creationSuccess = true;
        $scope.newRecordId = res.data[0]._id;

        $timeout(function () {
          $scope.creationSuccess = false;
          $scope.newRecordId = null;
        }, 7000);
      }
    });
  };
}]);

/**
 * Controller for the Server Display / Edit page
 */
thurgood.controller('ServerMaintainCtrl', ['$scope', '$routeParams', '$timeout', '$route', 'Servers', function ($scope, $routeParams, $timeout, $route, Servers) {
  'use strict';

  var serverId = $routeParams.id;

  if (angular.isUndefined(serverId)) {
    $scope.invalidServerId = true;
  }

  $scope.loading = true;
  $scope.error = false;

  $scope.mode = "display";

  $scope.updateSuccess = false;
  $scope.updateError = false;

  $scope.editServer = {};

  var promise = Servers.get({id: serverId}).$promise;

  // Handle errors
  var errorHandler = function(err) {
    $scope.loading = false;
    $scope.error = err.data.error || err.error || err.message || "Unknown error. Please contact support.";
  };

  promise.then(function (response) {
    if (response.success === false) {
      errorHandler(res);
      return;
    }

    var server = {};

    angular.forEach(response.data[0], function(value, key) {
      this[key] = value ? value : null;
    }, server);

    $scope.server = server;
    $scope.loading = false;
  });

  //Convert the array to string where entries are seperated by a comma
  $scope.getStringFromArray = function (arrayParam) {
    var stringOutput = '';

    if (!angular.isArray(arrayParam)) {
      return arrayParam;
    }

    for (var i = 0; i < arrayParam.length; i++) {
      if (stringOutput !== '') {
        stringOutput = stringOutput + ", ";
      }

      stringOutput = stringOutput + arrayParam[i];
    }

    return stringOutput;
  };

  //Set the mode (display / edit)
  $scope.changeMode = function (newMode) {
    $scope.mode = newMode;

    if ($scope.mode === "edit") {
      $scope.editServer = JSON.parse(JSON.stringify($scope.server));
    }
  };

  //Update the server
  $scope.updateServer = function () {
    if (angular.isUndefined($scope.editServer._id)) {
      return;
    }

    var updateServer = JSON.parse(JSON.stringify($scope.editServer));

    updateServer.installedServices = JSON.stringify(updateServer.installedServices);
    updateServer.languages = JSON.stringify(updateServer.languages);

    Servers.update({id: $scope.editServer._id}, updateServer, function (value) {
      if (!value.success) {
        $scope.updateError = true;

        $timeout(function () {
          $scope.updateError = false;
        }, 3000);
      } else {
        $scope.updateSuccess = true;

        $timeout(function () {
          $scope.updateSuccess = false;

          $route.reload();
        }, 3000);
      }
    });
  };
}]);

/**
 * Controller for a job's events page
 */
thurgood.controller('JobsEventsCtrl', ['$scope', '$routeParams', 'Jobs', 'Pt', function($scope, $routeParams, Jobs, Pt) {
  var jobId = $routeParams.id;
  var job = {};
  $scope.jobId = jobId;
  $scope.loading = true;

  //  fetch the job
  var jobPromise = Jobs.get({id: jobId}).$promise;
  // chain the token as a promise
  var tokenPromise = jobPromise.then(function(res) {
    if (res.success === false) {
      errorHandler(res);
      return;
    }

    // Save original document
    $scope.jobRaw = res.data[0];

    angular.forEach(res.data[0], function(value, key) {
      this[key] = value ? value : 'null';
    }, job);

    // return the token promise
    return Pt.get({key: res.data[0].userId}).$promise;
  });

  tokenPromise.then(function(res) {
    if (res.success === false) {
      errorHandler(res);
      return;
    }

    $scope.error = undefined;
    $scope.loading = false;
    $scope.job = job;
    $scope.timestamp = parseInt(new Date().getTime() / 1000);    
    $scope.token = res.message;
    $scope.distributor = "CloudSpokes";
  });

  // Handle errors
  var errorHandler = function(err) {
    $scope.loading = false;
    $scope.error = err.data.error || err.error || err.message || "Unknown error. Please contact support.";
  };

  // // API request error
  jobPromise.catch(errorHandler);
  tokenPromise.catch(errorHandler);
}]);
