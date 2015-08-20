var processor = require('../server/libs/processor');
var ThurgoodException = require('../server/libs/exception');
var Promise = require("bluebird");
var path = require("path");
var fse = Promise.promisifyAll(require('fs-extra'));
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
        assert.isNotNull(job.server);
        done();
      });
  });

  it('updates a job', function(done) {
    processor.findJobById('success-submit-job')
      .then(function(job){
        processor.updateJob(job, {language: 'Go'})
          .then(function(job){
            assert.equal(job.language, 'Go');
            done();
          })
      });
  });

  it('reserves a server', function(done) {
    processor.findJobById('processor-reserve-job')
      .then(processor.reserveServer)
      .then(function(job){
        assert.isNotNull(job.server);
        done();
      });
  });

  it('releases a server', function(done) {
    processor.findJobById('processor-reserve-release-job')
      .then(processor.reserveServer)
      .then(function(job){
        assert.isNotNull(job.server);
        processor.releaseServer(job)
          .then(function(job){
            assert.isFunction(job.server);
            done();
          })

      });
  });

  it('no server available', function(done) {
    processor.findJobById('processor-no-server-available-job')
      .then(processor.reserveServer)
      .catch(function(err){
        assert.equal(err.message, 'NO_SERVER_AVAILABLE');
        done();
      });
  });

  it('downloads a zip file and unpacks', function(done) {
    processor.findJobById('download-zip-job')
      .then(processor.downloadZip)
      .then(function(job){
        // assert there's a /tmp/download-zip-job/src directory
        assert.isTrue(fse.existsSync(path.resolve(__dirname, '../tmp', job.id.toString(), 'src')))
        // delete the test directory
        fse.removeSync(path.resolve(__dirname, '../tmp', job.id.toString()));
        done();
      });
  });

  it('rolls a job back', function(done) {
    processor.findJobById('rollback-job')
      .then(function(job){
        processor.rollback(job.id)
          .then(function(job){
            assert.isFunction(job.server);
            assert.equal(job.status, 'created');
            assert.isNull(job.startTime);
            assert.isNull(job.endTime);
            done()
          })
      });
  });

});
