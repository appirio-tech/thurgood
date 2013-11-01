var _ = require('underscore');
var assert = require('assert');
var request = require('request');
var setup = require('./setup.js');


describe("POST /awssignature", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should create s3 upload siganture", function (done) {
    var params = {
      redirect_url: setup.testUrl + "/jobs"
    };

    request.post({ url: setup.testUrl + "/awssignature", form: params }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data[0].aws.policy);
      assert.ok(body.data[0].aws.siganture);
      done();
    });
  });
});
