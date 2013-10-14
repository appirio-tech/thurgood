'use strict';

angular.module('thurgoodApp.controllers', [])
.controller('JobsCtrl', function ($scope, $http, $filter, ngTableParams) {
    var data = [];
    var filteredData = [];

    $scope.loading = true;
    $http.get('/api/v1/jobs')
    .success(function(resp) {
      data = resp.data;
      $scope.loading = false;
      setupTableParams();
    });

    function setupTableParams() {

      $scope.tableParams = new ngTableParams({
          page: 1,            // show first page
          count: 10,           // count per page
          sorting: {
              updatedAt: 'desc'     // initial sorting
          }
      }, {
          total: data.length, // length of data
          getData: function($defer, params) {
            filteredData = params.filter() ?
                   $filter('filter')(data, params.filter()) :
                   data;
            $scope.tableParams.total(filteredData.length);

            var orderedData = params.sorting() ?
                                $filter('orderBy')(filteredData, params.orderBy()) :
                                filteredData;

            $scope.jobs = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
            $defer.resolve($scope.jobs);
          }
      });

      $scope.changeCount = function(count) {
        $scope.tableParams.count(count);
      }
      $scope.goToPage = function(page) {
        $scope.tableParams.page(page);
      }
      $scope.search = function() {
        $scope.tableParams.filter($scope.query);
      }

      $scope.totalCount = function() {
        return data.length;
      }
      $scope.filteredCount = function() {
        return filteredData.length;
      }
      $scope.currentStart = function() {
        return ($scope.tableParams.page()-1)*$scope.tableParams.count()+1;
      }
      $scope.currentEnd = function() {
        return $scope.tableParams.page()*$scope.tableParams.count();
      }

      $scope.resubmit = function(job) {
        console.log("resubmit", job);
      }

    }

  });
