/**
 * Angular services
 */
var thurgood = angular.module('thurgoodServices', ['ngResource']);

/**
 * Resource for the /jobs endpoint
 * @return {$resource} Resource object
 */
thurgood.factory('Jobs', ['$resource', function($resource) {
  return $resource('/api/1/jobs/:id', {id:'@id'}, {
    query:    {method:'GET',  params:{fields:'{"platform":1,"language":1,"status":1,"updatedAt":1}'}},
    complete: {method:'GET',  url:'/api/1/jobs/:id/complete'},
    message:  {method:'POST', url:'/api/1/jobs/:id/message'},
    submit:   {method:'PUT',  url:'/api/1/jobs/:id/submit'}
  });
}]);
