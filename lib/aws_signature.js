var crypto = require('crypto');

function s3Signature(aws_secret_key, conditions, expiration_in_minutes) {
  var policy = { "conditions": conditions }, expiration = new Date();

  expiration_in_minutes = expiration_in_minutes || 3;
  expiration.setMinutes(expiration.getMinutes() + expiration_in_minutes);

  policy_json = JSON.stringify({expiration: expiration, conditions: conditions});
  
  var policy_base64 = new Buffer(policy_json)
                          .toString("base64")
                          .replace(/\n/g, "");


  var signature = crypto.createHmac("sha1", aws_secret_key)
                        .update(policy_base64)
                        .digest("base64")
                        .replace(/\n/g, "");
  return {
    "policy": policy_base64,
    "signature": signature
  }
}

exports.s3Signature = s3Signature;
