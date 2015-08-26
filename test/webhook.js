var app = require('../server/server.js');
var supertest = require('supertest');
var api = supertest('http://localhost:3000');
var should = require('chai').should();
var assert = require('chai').assert;
var crypto = require('crypto');

describe('Github Webhook', function() {

  before(function(done){
    // populate the test db with data
    require('./setup');
    done();
  });

  after(function(done){
    done();
  })

  it('processes a web hook successfully', function(done) {
    this.timeout(10000);
    var payload = {
      "repository": {
        "full_name": "jeffdonthemic/github-push-test"
      }
    };

    var signedPayload = function(payload) {
      return 'sha1=' + crypto.createHmac('sha1', process.env.GITHUB_SECRET).update(JSON.stringify(payload)).digest('hex');
    }

    api.post('/webhook')
    .set('x-hub-signature',  signedPayload(payload))
    .send(payload)
    .expect(function (res) {
      assert.equal(res.body.success, true);
    })
    .end(done);
  });

});
