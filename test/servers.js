var _ = require('underscore');
var assert = require('assert');
var request = require('request');
var setup = require('./setup.js');

var testingServerId;

describe("POST /servers", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should create a new server", function (done) {
    var params = {
      name: 'jeff',
      status: 'available'
    };

    request.post({ url: setup.testUrl + "/servers", form: params }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data[0].name == params.name);
      assert.ok(body.data[0].status == params.status);
      testingServerId = body.data[0]._id;
      done();
    });
  });
});

describe("GET /servers", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should return all servers", function (done) {
    request.get(setup.testUrl + "/servers", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length >= 0);
      done();
    });
  });

  it("should return servers by query", function (done) {
    request.get(setup.testUrl + "/servers?limit=2&q={\"name\":\"jeff\"}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object's name value is 'jeff'
      _.each(body.data, function(value) {
        assert.ok(value.name == 'jeff');
      });

      done();
    });
  });

  it("should return only specified fields", function (done) {
    request.get(setup.testUrl + "/servers?limit=2&fields={\"name\": 1, \"status\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object has only the 3 correct fields
      _.each(body.data, function(value) {
        _.each(Object.keys(value), function(key) {
          assert.ok(key == 'name' || key == 'status' || key == '_id');
        });
      });

      done();
    });
  });

  it("should return servers sorted asc", function (done) {
    request.get(setup.testUrl + "/servers?limit=3&sort={\"createdAt\": 1}", function (err, response, body) {
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

  it("should return servers sorted desc", function (done) {
    request.get(setup.testUrl + "/servers?limit=3&sort={\"createdAt\": -1}", function (err, response, body) {
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

  it("should return maximum x servers", function (done) {
    request.get(setup.testUrl + "/servers?limit=2", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length <= 2);
      done();
    });
  });

  it("should skip x servers", function (done) {
    request.get(setup.testUrl + "/servers?limit=3", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      
      // Get servers again and compare the responses
      request.get(setup.testUrl + "/servers?skip=1", function (err, response, body2) {
        body2 = JSON.parse(body2);
        assert.ok(body2.success);
        if (body.data.length > 1) {
          assert.ok(body.data[1]._id == body2.data[0]._id);
        }
        done();
      });
    });
  });

  it("should return servers by status", function (done) {
    request.get(setup.testUrl + "/servers?limit=3&status=available", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object's status is 'available'
      _.each(body.data, function(value) {
        assert.ok(value.status == 'available');
      });

      done();
    });
  });
});

describe("GET /servers/:id", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should return server by id", function (done) {
    request.get(setup.testUrl + "/servers/" + testingServerId, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length == 1);
      assert.ok(body.data[0]._id == testingServerId);
      done();
    });
  });

  it("should return only specified fields", function (done) {
    request.get(setup.testUrl + "/servers/" + testingServerId + "?fields={\"name\": 1, \"status\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object has only the 3 correct fields
      _.each(Object.keys(body.data[0]), function(key) {
        assert.ok(key == 'name' || key == 'status' || key == '_id');
      });

      done();
    });
  });
});

describe("PUT /servers/:id", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should update server", function (done) {
    var newName = 'jeff-' + Math.floor((Math.random()*100)+1);
    var params = { name: newName };

    request.put({ url: setup.testUrl + "/servers/" + testingServerId, form: params }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.name == newName);
      done();
    });
  });
});
