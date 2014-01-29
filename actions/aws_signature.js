var _ = require('underscore');
var aws = require("../lib/aws_signature");

/**
 *  Post /awsSignature
 *  Set Content Length Range : 100 MB = 104857600 bytes
 *  Default Expire signature token in 1 min
 */
exports.action = {
  name: "awsSignature",
  description: "Generate s3 signature to upload doc. Method: POST",
  inputs: {
    required: ['redirect_url', 'file_name'],
    optional: []
  },
  authenticated: true,
  outputExample: {},
  version: 1.0,
  run: function(api, connection, next) {
    var acl = 'public-read';
    var file_name = "upload/" + (new Date()).getTime() + '-' + connection.params.file_name;
    var signature = aws.s3Signature(api.configData.aws.secret_key, 
                      [
                        ["eq", "$bucket", api.configData.aws.bucket],
                        ["starts-with", "$key", file_name],
                        {"acl": acl},
                        ["starts-with", "$Content-Type", ""]
                      ], 
                    1); 

    signature.aws_access_key = api.configData.aws.access_key;
    signature.file_name = file_name;
    signature.acl = acl;
    signature.codeUrl = 'https://'+ api.configData.aws.bucket + '.s3.amazonaws.com/' + file_name; 

    api.response.success(connection, null, signature);
    next(connection, true);
  }
};