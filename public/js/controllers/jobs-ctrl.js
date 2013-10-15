'use strict';

ThurgoodApp.controller('JobsCtrl',
	['$scope', '$location', '$routeParams', '$timeout', '$http', function ($scope, $location, $routeParams, $timeout, $http) {

		//API path to jobs
		$scope.jobsRoute = '/api/1/jobs';

		//Field that will be loaded
		$scope.requestFields = {
			_id: true,
			platform: true,
			language: true,
			status: true,
			updatedAt: true
		};

		//Filter object that used by ng-grid
		$scope.filterOptions = {
			filterText: '',
			useExternalFilter: true
		};

		//Sort object that used by ng-grid
		$scope.sortInfo = {fields: [], directions: [], columns: []};

		//Pagination settings
		$scope.pagingOptions = {
			pageSizes: [50, 100, 250, 500, 1000], //available page sizes
			pageSize: 50, //current page size
			totalServerItems: 0, //current total items (it's workaround because API does't return totalCount)
			currentPage: 1 //current page
		};

		//Update data in the grid
		$scope.setPagingData = function(data){
			$scope.myData = data;
			$scope.pagingOptions.totalServerItems = data.length;
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		};

		//Convert grid filter object to API query params
		$scope.filter2Params = function(){
			var
				result = {'$and': []},
				filterText = ($scope.filterOptions.filterText || '').trim(),
				filters = filterText.split(',');

			angular.forEach(filters, function(item){
				item = (item || '').trim();
				var conditions = [];
				if(item){
					angular.forEach($scope.requestFields, function(val, key){
						var filter = {};
						filter[key] = { '$regex':  item , '$options': '-i'};
						conditions.push(filter);
					});
					result['$and'].push({
						'$or': conditions
					});
				}
			});
			if(result['$and'].length){
				return result;
			}
			return {};

		};

		//Convert grid sort object to API sort params
		$scope.buildSortParams = function(){
			var
				result = {},
				fields = $scope.sortInfo.fields,
				directions = $scope.sortInfo.directions;

			angular.forEach(fields, function(val, index){
				result[val] = directions[index] === 'asc' ? 1: -1;
			});
			return result;
		};

		//Method that fetch data from server
		$scope.getPagedData = function () {
			clearTimeout($scope.getPagedData.timeOut);
			$scope.getPagedData.timeOut = setTimeout(function(){
				var
					pageSize = $scope.pagingOptions.pageSize,
					page = ($scope.pagingOptions.currentPage || 1),
					query = $scope.filter2Params(),
					sort = $scope.buildSortParams();

				$http.get($scope.jobsRoute, {
					params: {
						limit: pageSize,
						skip: pageSize*(page-1),
						fields: $scope.requestFields,
						sort: JSON.stringify(sort),
						q: JSON.stringify(query)
					}

				}).success(function(responseData){
						var
							result = responseData.data;

						//loop for data deserialize
						//angular.foreEach is to slow
						for(var i= 0, len = result.length; i<len; ++i ){
							var item = result[i];
							item.updatedAt = new Date(item.updatedAt || 0);
						}
						$scope.setPagingData(result);
					});
			}, 100);
		};

		$scope.removeItem = function(id){
			if(confirm('Are you sure want to delete item with id ' + id)){
				$http({
					method: 'DELETE',
					url: $scope.jobsRoute + '/' + id
				}).success(function(){
						$scope.getPagedData();
					});
			}
			return false;
		};

		$scope.clearFilter = function(){
			$scope.filterOptions.filterText = '';
			$scope.pagingOptions.currentPage = 1;
		};
		//init data load
		$scope.getPagedData();


		$scope.$watch('pagingOptions', function (newVal, oldVal) {
			if (newVal !== oldVal ) {
				$scope.getPagedData();
			}
		}, true);

		$scope.$watch('filterOptions', function (newVal, oldVal) {
			if (newVal !== oldVal) {
				$scope.getPagedData();
			}
		}, true);

		$scope.$watch('sortInfo', function (newVal, oldVal) {
			if (newVal !== oldVal) {
				$scope.getPagedData();
			}
		}, true);

		//For more information check http://angular-ui.github.io/ng-grid/#/api
		$scope.gridOptions = {
			data: 'myData',
			enablePaging: true,
			showFooter: true,
			enableColumnResize: true,
			useExternalSorting: true,
			pagingOptions: $scope.pagingOptions,
			filterOptions: $scope.filterOptions,
			sortInfo: $scope.sortInfo,
			rowHeight: 37,
			columnDefs: [
				{field: '_id', displayName: 'Id', cellTemplate: '<div class="ngCellText"><a href="'+$scope.jobsRoute +'/{{row.getProperty(col.field)}}">{{row.getProperty(col.field)}}</a></div>'},
				{field:'platform', displayName:'Platform'},
				{field:'language', displayName:'Language'},
				{field:'status', displayName:'Status'},
				{field:'updatedAt', displayName:'Last Modified'},

				//delete Actions column if unneeded
				{field: '_id', displayName: 'Actions', width: 80, cellTemplate: '<div class="ngCellText"><button class="btn btn-danger" title="Delete" ng-click="removeItem(row.getProperty(col.field))"><i class="icon-trash icon-white"></i></button></div>'}

			]
		};
	}]);