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
        fields: '{"platform":1,"language":1,"status":1,"updatedAt":1, "project":1, "userId":1}'
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

/**
 * Resource for the /servers endpoint
 * @return {$resource} Resource object
 */
thurgood.factory('LoggerSystem', ['$resource', function ($resource) {
    return $resource('/api/1/loggers/:id', {id: '@id'});
}]);

thurgood.factory('Pt', ['$resource', function ($resource) {
    return $resource('/api/1/pt/token/:key', {key:'@key'}, {
        query: { method: 'GET' }
    });
}]);


thurgood.factory('Auth', function($http, $location){

  var accessLevels = routingConfig.accessLevels
      , userRoles = routingConfig.userRoles
      , currentUser = { username: '', role: userRoles.anon };


  function changeUser(user) {
      angular.extend(currentUser, user);
  };

  return {
    getCurrentUser: function(success, error) {
      $http.get('/api/userinfo').success(function(res){
        if(res.data) {
          changeUser(res.data);
          $http.defaults.headers.common['Authorization'] = 'Token token=' + currentUser.apiKey;            
        }

        if(res.message) {
          // TODO : display it nice
          alert(res.message);
        }

        success && success(currentUser);
        
      }).error(error);
    },

    isLoggedIn: function() {
      var user = currentUser;
      return user.role.title == userRoles.user.title || user.role.title == userRoles.admin.title;
    },

    logout: function() {
      $http.get("/api/logout").success(function() {
        changeUser({username: '', role: userRoles.anon});
        $http.defaults.headers.common['Authorization'] = 'Token token=invalid';
        $location.path('/');
      });
    },

    googleLogin: function() {
      window.location.pathname = "/api/auth/google"; 
    },

    isAccessible: function(access) {
      access = access || accessLevels.public;
      return access.bitMask & currentUser.role.bitMask;
    },

    accessLevels: accessLevels,
    userRoles: userRoles,
    user: currentUser,

  };
});

thurgood.factory('AwsS3', ['$http', function ($http) {
  return {
    signature: function(data){
      return $http.post('/api/1/awssignature', data);
    },

    upload: function(form, file, data, success){
      var fd = new FormData();

      fd.append('key', data.file_name);
      fd.append('acl', data.acl); 
      fd.append('Content-Type', '');      
      fd.append('AWSAccessKeyId', data.aws_access_key);
      fd.append('policy', data.policy)
      fd.append('signature', data.signature);
      fd.append("file", file);

      return $.ajax({
        url: form.attr('action'),
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',
        success: success,
        async: true
      });
    }
  }
}]);

