var app = require('../server/server.js');
var should = require('chai').should();
var assert = require('chai').assert;
var supertest = require('supertest');
var api = supertest('http://localhost:3000/api');

var User = app.models.User;

describe('Unauthenticated User', function() {

  before(function(done){
    // populate the test db with data
    require('./setup');
    done();
  });

  it('returns 401 for reading jobs', function(done) {
    api.get('/jobs')
    .expect(401, done);
  });

  it('returns 401 for reading projects', function(done) {
    api.get('/projects')
    .expect(401, done);
  });

  it('returns 401 for reading environments', function(done) {
    api.get('/environments')
    .expect(401, done);
  });

});
