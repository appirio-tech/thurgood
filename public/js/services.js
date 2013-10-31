/**
 * Angular services
 */
var thurgood = angular.module('thurgoodServices', ['ngResource', 'config']).config(function($httpProvider, APIKEY){
  $httpProvider.defaults.headers.common['Authorization'] = 'Token token=' + APIKEY;
});

/**
 * Resource for the /jobs endpoint
 * @return {$resource} Resource object
 */
thurgood.factory('Jobs', ['$resource', function ($resource) {
  return $resource('/api/1/jobs/:id', {id:'@id'}, {
    query: {
      method: 'GET',
      params: {
        limit: 0,
        fields: '{"platform":1,"language":1,"status":1,"updatedAt":1}'
      }
    },
    update: {
      method: 'PUT'
    },
    complete: {
      method: 'GET',
      url: '/api/1/jobs/:id/complete'
    },
    message: {
      method: 'POST',
      url: '/api/1/jobs/:id/message'
    },
    submit: {
      method: 'PUT',
      url: '/api/1/jobs/:id/submit'
    }
  });
}]);

/**
 * Resource for the /servers endpoint
 * @return {$resource} Resource object
 */
thurgood.factory('Servers', ['$resource', function ($resource) {
    return $resource('/api/1/servers/:id', {id: '@id'}, {
        query: {
            method: 'GET',
            params: {
                fields: '{"name":1,"installedServices":1,"languages":1,"operatingSystem":1,"platform":1,"status";1}',
                limit: 10000
            }
        },
        create: {
            method: 'POST'
        },
        update: {
            method: 'PUT',
            params: {
                id: '@id'
            }
        }
    });
}]);

thurgood.factory('Pt', ['$resource', function ($resource) {
    return $resource('/api/1/pt/token/:key', {key:'@key'}, {
        query: { method: 'GET' }
    });
}]);
