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
thurgood.controller('JobsCtrl', ['$scope', '$filter', '$location', 'Jobs', 'ngTableParams', function($scope, $filter, $location, Jobs, ngTableParams) {
  var promise = Jobs.query().$promise;
  $scope.loading = true;

  // Handle errors
  var errorHandler = function(err) {
    $scope.loading = false;
    $scope.error = err.data.error || err.error || err.message || "Unknown error. Please contact developer.";
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
}]);

/**
 * Controller for a job's detail page
 */
thurgood.controller('JobsDetailCtrl', ['$scope', '$location', 'Jobs', function($scope, $location, Jobs) {
  var jobId = $location.path().substring(6);
  var promise = Jobs.get({id: jobId}).$promise;
  $scope.jobId = jobId;
  $scope.loading = true;

  // Handle errors
  var errorHandler = function(err) {
    $scope.loading = false;
    $scope.error = err.data.error || err.error || err.message || "Unknown error. Please contact developer.";
  };

  // API request successful
  promise.then(function(res) {
    if (res.success === false) {
      errorHandler(res);
      return;
    }

    // Save original document
    $scope.jobRaw = res.data[0];

    // Format fields
    res.data[0].createdAt = res.data[0].createdAt ? new Date(res.data[0].createdAt).toISOString() : 'null';
    res.data[0].updatedAt = res.data[0].updatedAt ? new Date(res.data[0].updatedAt).toISOString() : 'null';
    res.data[0].startTime = res.data[0].startTime ? new Date(res.data[0].startTime).toISOString() : 'null';
    res.data[0].endTime = res.data[0].endTime ? new Date(res.data[0].endTime).toISOString() : 'null';
    res.data[0].options = res.data[0].options ? JSON.stringify(res.data[0].options) : 'null';

    var job = {};

    angular.forEach(res.data[0], function(value, key) {
      this[key] = value ? value : 'null';
    }, job);

    $scope.loading = false;
    $scope.job = job;
    $scope.error = undefined;
  });

  // API request error
  promise.catch(errorHandler);
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
    $scope.error = err.data.error || err.error || err.message || "Unknown error. Please contact developer.";
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
}]);

/**
 * Controller for the Server Create / Edit page
 */
thurgood.controller('ServerCreateCtrl', ['$scope', '$timeout', '$http', 'Servers', function ($scope, $timeout, $http, Servers) {
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
