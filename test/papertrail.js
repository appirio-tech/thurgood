var Promise = require("bluebird");
var pt = require('../server/libs/papertrail');
var should = require('chai').should();
var assert = require('chai').assert;

describe('Papertrail', function() {

  it('generates an sso token', function(done) {
    pt.token()
      .then(function(sso){
        assert.isNotNull(sso.token);
        assert.isNotNull(sso.timestamp);
        done();
      });
  });

  it('logs a message to papertrail', function(done) {
    pt.log('this is my message', 'mocha');
    done();
  });

});
