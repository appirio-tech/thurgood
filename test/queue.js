var processor = require('../server/libs/processor');
var kue = require('kue').createQueue();
var Promise = require("bluebird");
var expect = require('chai').expect;

describe('Queue', function() {

  var job;

  before(function(done){
    require('./setup');
    kue.testMode.enter();
    processor.findJobById('success-submit-job')
      .then(function(j){
        job = j;
        done();
      });
  });

  afterEach(function(done){
    kue.testMode.clear();
    done();
  });

  after(function(done){
    kue.testMode.exit();
    done();
  });

  it('adds job to queue successfully', function(done) {
    kue.createJob('submit', job).save();
    expect(kue.testMode.jobs.length).to.eql(1);
    expect(kue.testMode.jobs[0].type).to.equal('submit');
    expect(kue.testMode.jobs[0].data).to.eql(job);
    done();
  });

  it('adds email job to queue successfully', function(done) {
    kue.createJob('sendMail', job.id, 'Some Subject', 'Some Text').save();
    expect(kue.testMode.jobs.length).to.eql(1);
    expect(kue.testMode.jobs[0].type).to.equal('sendMail');
    done();
  });

});
