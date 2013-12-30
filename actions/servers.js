var accessLevels = require('../public/js/routingConfig').accessLevels;

/**
 * GET /servers
 * GET /servers/:id
 */
exports.action = {
  name: "serversFetch",
  description: "Returns a list of servers, or a specific one if id is defined. Method: GET",
  inputs: {
    required: [],
    optional: ['q', 'fields', 'sort', 'limit', 'skip', 'status', 'id'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.admin,
  run: function(api, connection, next) {
    api.mongo.get(api, connection, next, api.mongo.collections.servers);
  }
};

/**
 * POST /servers
 */
exports.serversCreate = {
  name: "serversCreate",
  description: "Creates a new server. Method: POST",
  inputs: {
    required: ['name', 'status', 'instanceUrl', 'repoName', 'platform', 'languages'],
    optional: ['operatingSystem', 'installedServices', 'username', 'password', 'jobId', 'project'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.admin,
  run: function(api, connection, next) {
    api.mongo.create(api, connection, next, api.mongo.collections.servers, api.mongo.schema.server);
  }
};

/**
 * PUT /servers/:id
 */
exports.serversUpdate = {
  name: "serversUpdate",
  description: "Updates a server. Method: PUT",
  inputs: {
    required: ['id', 'name', 'status', 'instanceUrl', 'repoName', 'platform', 'languages'],
    optional: ['operatingSystem', 'installedServices', 'username', 'password', 'jobId', 'project'],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  access: accessLevels.admin,  
  run: function(api, connection, next) {
    api.mongo.update(api, connection, next, api.mongo.collections.servers, api.mongo.schema.server);
  }
};
