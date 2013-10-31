var S = require('string');

exports.middleware = function(api, next){

    // parses the api_key from the Authorization request header:
    // header['Authorization'] = 'Token token="THIS-IS-MY-TOKEN"'
  var authorization = function(connection, actionTemplate, next){
    if(actionTemplate.authenticated === true){

      // if for dev we want to skip the API Key authentication for protected routes
      if (api.configData.general.skipAuthorization === "true") { return next(connection, true); }

      var redis = api.redis.client;
      var authorization = connection.rawConnection.req.headers.authorization;   

      // if authorization found in the header
      if (typeof(authorization) != "undefined") {
        try {

          // parse the apiKey from: 'Token token="THIS-IS-MY-TOKEN"'
          var apiKey = S(authorization.split("=")[1]).replaceAll('"', '').s;

          // does the apiKey exist in the hash of api keys in redis?
          redis.hexists("api:keys", apiKey, function(error, found){
            if (found === 0) { 
              errorResponse(connection);
              next(connection, false); 
            }
            if (found === 1) { next(connection, true); }
          });      

        } catch (err) {
          console.log("Could not parse API Key: " + err.message);
          errorResponse(connection);    
          next(connection, false);
        }
      // if authorization not found in the header
      } else {
        errorResponse(connection);
        next(connection, false);
      }

    }else{
      next(connection, true);
    }
  }

  var errorResponse = function(connection) {
    connection.response.error = "unauthorized";
    connection.response.error_description = "This action requires authorization to continue.";
    connection.rawConnection.responseHttpCode = 401;     
  };    

  api.actions.preProcessors.push(authorization);

  next();
}