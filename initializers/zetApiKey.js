exports.zetApiKey = function(api, next){

  api.users.findByEmail("api-user@thurgood").then(function(user) {
    if (user) {
      api.configData.general.apiKey = user.apiKey;
    } else {
		api.redis.client.hset("api:keys", user.apiKey, "api-user@thurgood");
      console.log("[FATAL] Could not set internal API key. See https://github.com/cloudspokes/thurgood/wiki/Security-&-API-Keys");
    }
  }, function(error) {
    console.log("[FATAL] Error finding API user.");   
  });

  next();
}