var crypto = require('crypto');

function s3Signature(aws_secret_key, conditions, expiration_in_minutes) {
  var policy = { "conditions": conditions }, expiration = new Date();

  expiration_in_minutes = expiration_in_minutes || 2;
  expiration.setMinutes(expiration.getMinutes() + expiration_in_minutes);
  policy['expiration'] = expiration; 

  var policy_base64 = new Buffer(JSON.stringify(policy))
                          .toString("base64")
                          .replace(/\n/g, "");


  var signature = crypto.createHmac("sha1", aws_secret_key)
                        .update(s3Policy(conditions, expiration_in_minutes))
                        .digest("base64")
                        .replace(/\n/g, "");
  return {
    "policy": policy_base64,
    "signature": signature
  }
}

function s3Policy(conditions, expiration_in_minutes){
  var policy = { "conditions": conditions }, expiration = new Date();

  expiration_in_minutes = expiration_in_minutes || 2;
  expiration.setMinutes(expiration.getMinutes() + expiration_in_minutes);
  policy['expiration'] = expiration; 

  return new Buffer(JSON.stringify(policy)).toString("base64").replace(/\n/g, "");
}


exports.s3Signature = s3Signature;
exports.s3Policy = s3Policy;


