var _ = require('underscore');
var assert = require('assert');
var request = require('request');
var setup = require('./setup.js');

var testingAccountId;

describe("POST /accounts", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should create a new account", function (done) {
    var params = {
      username: 'jeffd',
      email: 'jeffd@thurgood.com'
    };

    request.post({ url: setup.testUrl + "/accounts", form: params }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data[0].name == params.username);
      assert.ok(body.data[0].email == params.email);
      testingAccountId = body.data[0]._id;
      done();
    });
  });
});

describe("GET /accounts", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should return all accounts", function (done) {
    request.get(setup.testUrl + "/accounts", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length >= 0);
      done();
    });
  });

  it("should return accounts by query", function (done) {
    request.get(setup.testUrl + "/accounts?q={\"name\":\"jeffd\"}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data[0].name == 'jeffd');
      done();
    });
  });

  it("should return only specified fields", function (done) {
    request.get(setup.testUrl + "/accounts?limit=2&fields={\"name\": 1, \"email\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object has only the 3 correct fields
      _.each(Object.keys(body.data[0]), function(key) {
        assert.ok(key == 'name' || key == 'email' || key == '_id');
      });

      done();
    });
  });

  it("should return accounts sorted asc", function (done) {
    request.get(setup.testUrl + "/accounts?sort={\"createdAt\": 1}", function (err, response, body) {
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

  it("should return accounts sorted desc", function (done) {
    request.get(setup.testUrl + "/accounts?limit=3&sort={\"createdAt\": -1}", function (err, response, body) {
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

  it("should return maximum x accounts", function (done) {
    request.get(setup.testUrl + "/accounts?limit=2", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length <= 2);
      done();
    });
  });

  it("should skip x accounts", function (done) {
    request.get(setup.testUrl + "/accounts?limit=3", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      
      // Get accounts again and compare the responses
      request.get(setup.testUrl + "/accounts?skip=1", function (err, response, body2) {
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

describe("GET /accounts/:id", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should return account by id", function (done) {
    request.get(setup.testUrl + "/accounts/" + testingAccountId, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      assert.ok(body.data.length == 1);
      assert.ok(body.data[0]._id == testingAccountId);
      assert.ok(body.data[0].loggerSystems.length >= 0);
      done();
    });
  });

  it("should return only specified fields", function (done) {
    request.get(setup.testUrl + "/accounts/" + testingAccountId + "?fields={\"name\": 1, \"email\": 1}", function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);

      // Check if every object has only the 3 correct fields
      _.each(Object.keys(body.data[0]), function(key) {
        assert.ok(key == 'name' || key == 'email' || key == '_id');
      });

      done();
    });
  });
});

describe("DELETE /accounts/:id", function () {
  before(function (done) {
    setup.init(done);
  });

  it("should delete account", function (done) {
    request.del(setup.testUrl + "/accounts/" + testingAccountId, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      done();
    });
  });
});
