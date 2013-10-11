var CONFIG = {
    NUMBER_OF_RECORDS : [10,25,50,100]
};

angmodule.controller("GlobalCtrl",
    function($scope, $http, $filter){
    	console.log('GlobalCtrl');
    }
);

angmodule.controller("HomeCtrl",
    function($scope, $http, $filter){
    	console.log('HomeCtrl');
    }
);

angmodule.controller("JobsListCtrl",
    function($scope, $http, $filter,ThurgoodProxy){
    	console.log('JobsListCtrl');

        $scope.errorMsg = null;
    	$scope.loading = true;
        $scope.numberOfRecordsOptions = angular.copy(CONFIG.NUMBER_OF_RECORDS);
        $scope.sortOrder = 'updatedAt';
        $scope.jobs = [];

        $scope.currentPage = 1;
        $scope.pageSize = $scope.numberOfRecordsOptions[0];
        $scope.numberOfPages = function(){
            return Math.ceil($scope.jobs.length/$scope.pageSize);                
        }

        //init call for jobs list
        ThurgoodProxy.getJobsList(
            function(data){

                $scope.loading = false;

                if(!data || !data.success){
                    $scope.jobs = [];
                    $scope.errorMsg = 'No data or server error';
                    return;
                }

                $scope.jobs = data.data;

            },
            function(error){
                $scope.jobs = [];
                $scope.loading = false;
                $scope.errorMsg = error;
            }
        );

        //set order by and reverse
        $scope.setOrderBy = function(fieldName){
            if($scope.sortOrder === fieldName)
                $scope.sortOrder = '-'+fieldName;
            else
                $scope.sortOrder = fieldName;
        }

        $scope.submitJob = function(jobId){
            alert('Jbo '+jobId+' submitted!');
        }
    	
    }
);

angmodule.controller("JobDetailCtrl",
    function($scope, $http, $filter, $routeParams,ThurgoodProxy){
        console.log('JobDetailCtrl');

        $scope.errorMsg = null;
        $scope.loading = true;
        $scope.job = null;

        //init call for selected job
        ThurgoodProxy.getJobById($routeParams.id,
            function(data){

                $scope.loading = false;

                if(!data || !data.success){
                    $scope.job = null;
                    $scope.errorMsg = 'No job found or server error';
                    return;
                }
                if(data.data.length === 0){
                    $scope.job = null;
                    $scope.errorMsg = 'No job found.';
                    return;
                }
                $scope.job = data.data[0];
                
            },
            function(error){
                $scope.job = null;
                $scope.loading = false;
                $scope.errorMsg = error;
            }
        );
    }
);