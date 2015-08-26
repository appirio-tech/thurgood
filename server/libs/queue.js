var kue = require('kue');
var queue = kue.createQueue();
var path = require("path");
var Promise = require("bluebird");
var fse = Promise.promisifyAll(require('fs-extra'));
var logger = require('strong-logger');
var processor = require('./processor');
var repo = require('./repo');
var github = require('./github');
var pt = require('../../server/libs/papertrail');

/*
* Submit job for processing
*/
exports.submitJob = function(job){
 var job = queue.create('submit', {
   job: job
 });

 job
   .on('enqueue', function (){
     pt.log('[queue] job has been added to the queue.', job.data.job.id);
     logger.info('[job-'+job.data.job.id+'] job has been added to the queue.');
   })
   .on('complete', function (){
     pt.log('[queue] job exited the queue successfully.', job.data.job.id);
     logger.info('[job-'+job.data.job.id+'] job exited the queue successfully.');
   })
   .on('failed', function (err){
     pt.log('[queue] job failed in the queue with the following error: ' + err, job.data.job.id);
     logger.info('[job-'+job.data.job.id+'] job failed in the queue with the following error: ' + err);
   })
 job.save();
}

queue.process('submit', function (job, done){
  var jobId = job.data.job.id;
  processor.downloadZip(job.data.job)
    .then(repo.addJobProperties)
    .then(repo.addBuildProperties)
    .then(repo.addShellAssets)
    .then(github.push)
    .then(processor.sendJobSubmittedMail)
    .then(function() {
      done && done();
    }).catch(function(err) {
      // rollback the job and environment to previous state if there was an error
      processor.rollback(jobId)
        .then(sendJobErrorMail)
        .then(function(){
         return done(err);
       })
    }).finally(function(){
      // clean up after ourselves by deleting downloading directories & keys
      fse.removeSync(path.resolve(__dirname, '../../tmp/' + jobId));
      fse.removeSync(path.resolve(__dirname, '../../tmp/keys/' + jobId));
    });
});
