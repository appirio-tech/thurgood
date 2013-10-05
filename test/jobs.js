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

describe("GET /jobs", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should return all jobs", function (done) {
    request.get(setup.testUrl + "/jobs", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length >= 0);
      done();
    });
  });

  it("should return jobs by query", function (done) {
    request.get(setup.testUrl + "/jobs?limit=2&q={\"userId\":\"jeff\"}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object's userId value is 'jeff'
      _.each(body.data, function(value) {
        assert.ok(value.userId == 'jeff');
      });

      done();
    });
  });

  it("should return only specified fields", function (done) {
    request.get(setup.testUrl + "/jobs?limit=2&fields={\"userId\": 1, \"status\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object has only the 3 correct fields
      _.each(body.data, function(value) {
        _.each(Object.keys(value), function(key) {
          assert.ok(key == 'userId' || key == 'status' || key == '_id');
        });
      });

      done();
    });
  });

  it("should return jobs sorted asc", function (done) {
    request.get(setup.testUrl + "/jobs?limit=3&sort={\"createdAt\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if objects are sorted correctly by createdAt
      var previousTimestamp = 0;

      _.each(body.data, function(value) {
        assert.ok(value.createdAt >= previousTimestamp);
        previousTimestamp = value.createdAt;
      });
      
      done();
    });
  });

  it("should return jobs sorted desc", function (done) {
    request.get(setup.testUrl + "/jobs?limit=3&sort={\"createdAt\": -1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if objects are sorted correctly by createdAt
      var previousTimestamp = new Date().getTime();

      _.each(body.data, function(value) {
        assert.ok(value.createdAt <= previousTimestamp);
        previousTimestamp = value.createdAt;
      });
      
      done();
    });
  });

  it("should return maximum x jobs", function (done) {
    request.get(setup.testUrl + "/jobs?limit=2", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length <= 2);
      done();
    });
  });

  it("should skip x jobs", function (done) {
    request.get(setup.testUrl + "/jobs?limit=3", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      
      // Get jobs again and compare the responses
      request.get(setup.testUrl + "/jobs?skip=1", function (err, response, body2) {
        body2 = JSON.parse(body2);
        assert.ok(body2.success);
        if (body.data.length > 1) {
          assert.ok(body.data[1]._id == body2.data[0]._id);
        }
        done();
      });
    });
  });
});

describe("GET /jobs/:id", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should return job by id", function (done) {
    request.get(setup.testUrl + "/jobs/" + testingJobId, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length == 1);
      assert.ok(body.data[0]._id == testingJobId);
      done();
    });
  });

  it("should return only specified fields", function (done) {
    request.get(setup.testUrl + "/jobs/" + testingJobId + "?fields={\"userId\": 1, \"status\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object has only the 3 correct fields
      _.each(Object.keys(body.data[0]), function(key) {
        assert.ok(key == 'userId' || key == 'status' || key == '_id');
      });

      done();
    });
  });
});

describe("PUT /jobs/:id", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should update job", function (done) {
    var params = {
      status: 'completed'
    };

    request.put({ url: setup.testUrl + "/jobs/" + testingJobId, form: params }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.status == params.status);
      done();
    });
  });
});
