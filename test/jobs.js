var _ = require('underscore');
var assert = require('assert');
var request = require('request');
var setup = require('./setup.js');

var testingJobId;

describe("POST /jobs", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should create a new job", function (done) {
    var params = {
      userId: 'jeff',
      status: 'pending'
    };

    request.post({ url: setup.testUrl + "/jobs", form: params }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data[0].userId == params.userId);
      assert.ok(body.data[0].status == params.status);
      testingJobId = body.data[0]._id;
      done();
    });
  });
});
