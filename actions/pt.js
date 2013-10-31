var papertrail = require('../lib/papertrail');

exports.action = {
  name: "ptFetchToken",
  description: "Returns a generated SSO token. Method: GET",
  inputs: {
    required: ['key'],
    optional: [],
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    api.response.success(connection, papertrail.token(connection.params.key));
    next(connection, true);
  }
};