var app = require('../server/server.js');
var Promise = require("bluebird");
var repo = require('../server/libs/repo');
var properties = require ("properties");
var path = require("path");
var fse = Promise.promisifyAll(require('fs-extra'));
var should = require('chai').should();
var assert = require('chai').assert;

describe('Repo Processor', function() {

  var tmpDir;
  var job;

  before(function(done){
    // populate the test db with data
    require('./setup');
    // find a specific job
    app.models.Job.findById('success-submit-job', {include: 'environment'},  function(err, obj){
      job = obj;
      tmpDir = path.resolve(__dirname, '../app/tmp/' + job.id);
      fse.ensureDirAsync(tmpDir);
      done();
    });

  });

  after(function(done){
    fse.delete(tmpDir, function (err) {
      if (err) console.log(err);
       done();
    });
  })

  it('writes job.properties file successfully', function(done) {
    repo.addJobProperties(job)
      .then(function(){
        properties.parse(tmpDir + '/job.properties', { path: true }, function (error, props){
          assert.equal(props.JOB_ID, job.id);
          assert.equal(props.SFDC_DEPLOY, true);
          done();
        });
      })
  });

  it('writes build.properties file successfully', function(done) {
    repo.addBuildProperties(job)
      .then(function(){
        properties.parse(tmpDir + '/build.properties', { path: true, namespaces: true }, function (error, props){
          assert.equal(props.sf.username, 'jeff');
          assert.equal(props.sf.password, '234567');
          assert.equal(props.sf.serverurl, 'https://login.salesforce.com');
          done();
        });
      })
  });

});
