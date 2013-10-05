var _ = require('underscore');
var assert = require('assert');
var request = require('request');
var setup = require('./setup.js');
var querystring = require("querystring");
var testingAccountId;

describe("POST /loggers", function () {
  before(function (done) {
     setup.init(done);
  });

  it("creates a new logger", function (done) {
    var params = {
      name: 'jeff',
      loggerAccountId: '14',
      papertrailAccountId: "cs-dev-chang1"
    };

    request.post({ url: setup.testUrl + "/loggers", form: params }, function (err, response, body) {
      body = JSON.parse(body);
      assert.ok(body.success);
      done();
    });
  });

  it("deletes logger", function (done) {
    var params = {
      name: 'jeff',
      loggerAccountId: '14',
      papertrailAccountId: "cs-dev-chang1"
    };
    // creates first
    request.post({ url: setup.testUrl + "/loggers", form: params }, function (err, response, body) {
      var data = JSON.parse(body);
      var papertrailId = data.data.papertrailId;
      // then deletes
      request.del({ url: setup.testUrl + "/loggers/" + papertrailId }, function (err, response, body) {
        body = JSON.parse(body);
        assert.ok(body.success);
        done();
      });
    });

  });

});

