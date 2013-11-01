var _ = require('underscore');

/**
 *  Post /awsSignature
 *  Set Content Length Range : 100 MB = 104857600 bytes
 *  Default Expire signature token in 1 min
 */
exports.action = {
  name: "awsSignature",
  description: "Generate s3 signature to upload doc. Method: POST",
  inputs: {
    required: ['redirect_url'],
    optional: []
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var signature = s3Signature(api.configData.aws.secret_key, 
                      [
                        ["starts-with", "$key", "thurgood/"],
                        {"acl": "public-read"},
                        {"success_action_redirect": connection.params.redirect_url},
                        ["starts-with", "$Content-Type", ""],
                        ["content-length-range", 0, 104857600]
                      ], 
                    1); 
    connection.response.aws = signature;
    next(connection, true);
  }
};
