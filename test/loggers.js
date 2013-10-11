var _ = require('underscore');
var assert = require('assert');
var request = require('request');
var setup = require('./setup.js');
var querystring = require("querystring");

var testingLoggerId, testingAccount;

describe("POST /loggers", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should create a new logger", function (done) {
    var params = {
      username: 'jeffth',
      email: 'jeffth@thurgood.com'
    };

    request.post({ url: setup.testUrl + "/accounts", form: params }, function (err, response, body) {
      body = JSON.parse(body);
      testingAccount = body.data[0];
      
      var params = {
        name: 'jeff3l',
        loggerAccountId: testingAccount._id,
        papertrailId: "member-challenge2"
      };

      request.post({ url: setup.testUrl + "/loggers", form: params }, function (err, response, body) {
        body = JSON.parse(body);
        assert.ok(body.success);
        testingLoggerId = body.data._id || body.data[0]._id;
        done();
      });
    });
  });
});

describe("GET /loggers", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should return all loggers", function (done) {
    request.get(setup.testUrl + "/loggers", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length >= 0);
      done();
    });
  });

  it("should return loggers by query", function (done) {
    request.get(setup.testUrl + "/loggers?limit=2&q={\"name\":\"jeff3l\"}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object's name value is 'jeff3l'
      _.each(body.data, function(value) {
        assert.ok(value.name == 'jeff3l');
      });

      done();
    });
  });

  it("should return only specified fields", function (done) {
    request.get(setup.testUrl + "/loggers?limit=2&fields={\"name\": 1, \"loggerAccountId\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object has only the 3 correct fields
      _.each(body.data, function(value) {
        _.each(Object.keys(value), function(key) {
          assert.ok(key == 'name' || key == 'loggerAccountId' || key == '_id');
        });
      });

      done();
    });
  });

  it("should return loggers sorted asc", function (done) {
    request.get(setup.testUrl + "/loggers?limit=3&sort={\"createdAt\": 1}", function (err, response, body) {
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

  it("should return loggers sorted desc", function (done) {
    request.get(setup.testUrl + "/loggers?limit=3&sort={\"createdAt\": -1}", function (err, response, body) {
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

  it("should return maximum x loggers", function (done) {
    request.get(setup.testUrl + "/loggers?limit=2", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length <= 2);
      done();
    });
  });

  it("should skip x loggers", function (done) {
    request.get(setup.testUrl + "/loggers?limit=3", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      
      // Get loggers again and compare the responses
      request.get(setup.testUrl + "/loggers?skip=1", function (err, response, body2) {
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

describe("GET /loggers/:id", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should return logger by id", function (done) {
    request.get(setup.testUrl + "/loggers/" + testingLoggerId, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length == 1);
      assert.ok(body.data[0]._id == testingLoggerId);
      done();
    });
  });

  it("should return only specified fields", function (done) {
    request.get(setup.testUrl + "/loggers/" + testingLoggerId + "?fields={\"name\": 1, \"loggerAccountId\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object has only the 3 correct fields
      _.each(Object.keys(body.data[0]), function(key) {
        assert.ok(key == 'name' || key == 'loggerAccountId' || key == '_id');
      });

      done();
    });
  });
});

describe("PUT /loggers/:id", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should update logger", function (done) {
    var newName = 'jeff-' + Math.floor((Math.random()*100)+1);
    var params = { name: newName };
    
    request.put({ url: setup.testUrl + "/loggers/" + testingLoggerId, form: params }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.name == newName);
      done();
    });
  });
});

describe("DELETE /loggers/:id", function () {
  before(function (done) {
     setup.init(done);
  });

  it("should delete logger", function (done) {
    request.del({ url: setup.testUrl + "/loggers/" + testingLoggerId }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      
      request.del(setup.testUrl + "/accounts/" + testingAccount._id, function (err, response, body) {
        done();
      });
    });
  });
});
