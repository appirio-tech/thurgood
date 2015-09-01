'use strict'

var processor = require('../server/libs/processor');
var ThurgoodException = require('../server/libs/exception');
var Promise = require("bluebird");
var fse = Promise.promisifyAll(require('fs-extra'));
var path = require("path");
var appRoot = require('app-root-path');
var request = require('request');
var should = require('chai').should();
var assert = require('chai').assert;

describe('Job Processor', function() {

  before(function(done){
    // populate the test db with data
    require('./setup');
    done();
  });

  after(function(done){
    done();
  })

  it('finds a job id', function(done) {
    processor.findJobById('success-submit-job')
      .then(function(job){
        assert.equal(job.id, 'success-submit-job');
        assert.isNotNull(job.environment);
        done();
      });
  });

  it('updates a job', function(done) {
    processor.findJobById('success-submit-job')
      .then(function(job){
        processor.updateJob(job, {notification: 'carrier pigeon'})
          .then(function(job){
            assert.equal(job.notification, 'carrier pigeon');
            done();
          })
      });
  });

  it('reserves a environment', function(done) {
    processor.findJobById('processor-reserve-job')
      .then(processor.reserveEnvironment)
      .then(function(job){
        assert.isNotNull(job.environment);
        done();
      });
  });

  it('releases a environment', function(done) {
    processor.findJobById('processor-reserve-release-job')
      .then(processor.reserveEnvironment)
      .then(function(job){
        assert.isNotNull(job.environment);
        processor.releaseEnvironment(job)
          .then(function(job){
            assert.isFunction(job.environment);
            done();
          })

      });
  });

  it('no environment available', function(done) {
    processor.findJobById('processor-no-environment-available-job')
      .then(processor.reserveEnvironment)
      .catch(function(err){
        assert.equal(err.message, 'NO_ENVIRONMENT_AVAILABLE');
        done();
      });
  });

  it('downloads a zip file and unpacks', function(done) {
    processor.findJobById('download-zip-job')
      .then(processor.downloadZip)
      .then(function(job){
        // assert there's a /tmp/download-zip-job/src directory
        assert.isTrue(fse.existsSync(path.resolve(appRoot.path, '/tmp', job.id.toString(), 'src')))
        // delete the test directory
        fse.removeSync(path.resolve(appRoot.path, '/tmp', job.id.toString()));
        done();
      });
  });

  it('downloads github zip archive successfully', function(done) {
    this.timeout(10000);
    processor.findJobById('webhook-job')
      .then(processor.downloadZip)
      .then(function(job){
        // assert there's is no /tmp/webhook-job/push-test-master directory
        assert.isFalse(fse.existsSync(path.resolve(appRoot.path, '/tmp', job.id.toString(), 'push-test-master')))
        // delete the test directory
        fse.removeSync(path.resolve(appRoot.path, '/tmp', job.id.toString()));
        done();
      });
  });

  it('rolls a job back', function(done) {
    processor.findJobById('rollback-job')
      .then(function(job){
        processor.rollback(job.id)
          .then(function(jobId){
            processor.findJobById(jobId)
              .then(function(job){
                assert.isFunction(job.environment);
                assert.equal(job.status, 'created');
                assert.isNull(job.startTime);
                assert.isNull(job.endTime);
                done();
              });
          })
      });
  });

});
