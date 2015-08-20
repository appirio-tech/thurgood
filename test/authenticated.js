var app = require('../server/server.js');
var should = require('chai').should();
var assert = require('chai').assert;
var supertest = require('supertest');
var api = supertest('http://localhost:3000/api');

var User = app.models.User;
var Server = app.models.Server;

var accessToken;
var username = 'test-user1';
var password = 'password'

/*
  This suite is needed to that before the test runs, it can ensure that
  there are 0 available server for Salesforce jobs and can return the
  proper error
*/
describe('Authenticated User - No Available Servers', function() {

  before(function(done){
    // populate the test db with data
    require('./setup');
    // log the user in
    User.login({username: username, password: password}, function(err, results) {
      if (err) { console.log(err); }
      accessToken = results.id;
      // find the existing salesforce server and make it complete
      Server.findOne({ where: {and: [{platform: 'salesforce'}, {status: 'available'}]}}, function(err, server){
        if (server) {
          server.updateAttributes({jobId: server.jobId, status: 'reserved'})
          done();
        }
      })
    });
  });

  it('handles no servers available', function(done) {

    api.put('/jobs/no-servers-job/submit?access_token='+accessToken)
    .expect(200)
    .expect(function (res) {
      assert.equal(res.body.id, 'no-servers-job');
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'No Salesforce servers available for processing at this time. Please submit your job later.');
    })
    .end(done);

  });

  after(function(done){
    // find the existing salesforce server and make it complete
    Server.findOne({ where: {and: [{platform: 'salesforce'}, {status: 'reserved'}]}}, function(err, server){
      if (server) {
        server.updateAttributes({jobId: server.jobId, status: 'available'})
        done();
      }
    })
  });

})

describe('Authenticated User', function() {

  before(function(done){
    // populate the test db with data
    require('./setup');
    // log the user in
    User.login({username: username, password: password}, function(err, results) {
      if (err) { console.log(err); }
      accessToken = results.id;
      done();
    });
  });

  it('reads all jobs currectly', function(done) {
    api.get('/jobs?access_token='+accessToken)
    .expect(200, done);
  });

  it('reads all servers correctly', function(done) {
    api.get('/servers?access_token='+accessToken)
    .expect(200, done);
  });

  it('reads all projects currectly', function(done) {
    api.get('/projects?access_token='+accessToken)
    .expect(200, done);
  });

  it('posts a new message for a job', function(done) {
    api.post('/jobs/message-job/message?access_token='+accessToken)
    .send({
      "message": "Ran successfully",
      "sender": "jenkins"
    })
    .expect(function (res) {
      assert.equal(res.body.success, true);
    })
    .end(done);
  });

  it('marks a job as complete', function(done) {
    api.get('/jobs/complete-job/complete?access_token='+accessToken)
    .expect(200)
    .expect(function (res) {
      assert.equal(res.body.status, 'complete');
      assert.isUndefined(res.body.server);
    })
    .end(done);
  });

  it('submits a job for processing', function(done) {
    this.timeout(10000);
    api.put('/jobs/success-submit-job/submit?access_token='+accessToken)
    .expect(200)
    .expect(function (res) {
      assert.equal(res.body.success, true);
      assert.equal(res.body.id, 'success-submit-job');
      assert.equal(res.body.message, 'Job in progress');
      assert.equal(res.body.job.status, 'in progress');
    })
    .end(done);
  });

  it('handles BAD ZIP job submission error', function(done) {
    this.timeout(2000);
    api.put('/jobs/bad-zip-job/submit?access_token='+accessToken)
    .expect(500)
    .expect(function (res) {
      assert.equal(res.body.error.message, 'Invalid or unsupported zip format. No END header found');
    })
    .end(done);
  });

});
