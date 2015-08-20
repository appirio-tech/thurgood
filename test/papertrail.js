// var app = require('../server/server.js');
var Promise = require("bluebird");
var pt = require('../server/libs/papertrail');
var should = require('chai').should();
var assert = require('chai').assert;

describe.only('Papertrail', function() {

  it('generates an sso token', function(done) {
    pt.token()
      .then(function(sso){
        assert.isNotNull(sso.token);
        assert.isNotNull(sso.timestamp);
        done();
      });
  });

});
