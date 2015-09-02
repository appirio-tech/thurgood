var path = require("path");
var appRoot = require('app-root-path');
var Promise = require("bluebird");
var fse = Promise.promisifyAll(require('fs-extra'));
var logger = require('strong-logger');
var github = require(appRoot + '/server/libs/github');
var processor = require(appRoot + '/server/libs/processor');
var repo = require(appRoot + '/server/libs/repo');
var github = require(appRoot + '/server/libs/github');
var pt = require(appRoot + '/server/libs/papertrail');
var app = require(appRoot + '/server/server.js');
var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var url = require('url');
var kue = require('kue');

if (process.env.REDIS_URL) {
  var redisURL = url.parse(process.env.REDIS_URL);
  var queue = kue.createQueue({
    prefix: 'q',
    redis: {
      port: redisURL.port,
      host: redisURL.hostname,
      auth: redisURL.auth.split(":")[1]
    }
  });
} else {
  var queue = kue.createQueue();
}

/*
* Watch for any errors in the queue
*/
queue.on( 'error', function( err ) {
  logger.error('The queue threw an error: ' + err);
});

/*
* Submit job for processing
*/
exports.submitJob = function(job){
 var job = queue.create('submit', {
   title: 'job ' + job.id,
   job: job
 });

 job
   .on('enqueue', function (){
     pt.log('[queue] job has been added to the queue.', job.data.job.id);
     logger.info('[job-'+job.data.job.id+'] job has been added to the queue.');
   })
   .on('complete', function (){
     pt.log('[queue] job exited the queue successfully.', job.data.job.id);
     logger.info('[job-'+job.data.job.id+'] job completed the queue successfully.');
   })
   .on('failed', function (err){
     pt.log('[queue] job failed in the queue with the following error: ' + err, job.data.job.id);
     logger.error('[job-'+job.data.job.id+'] job failed in the queue with the following error: ' + err);
   })
 job.save();
}

queue.process('submit', function (job, done){
  var jobId = job.data.job.id;
  pt.log('[queue] job has started processing.', jobId);
  logger.info('[job-'+jobId+'] job has started processing.');
  processor.downloadZip(job.data.job)
    .then(repo.addJobProperties)
    .then(repo.addBuildProperties)
    .then(repo.addShellAssets)
    .then(github.push)
    .then(processor.sendJobSubmittedMail)
    .then(function() {
      done();
    }).catch(function(err) {
      logger.error('[job-'+jobId+'] queue error: ' + err);
      // rollback the job and environment to previous state if there was an error
      processor.rollback(jobId)
        .then(processor.sendJobErrorMail)
        .then(function(){
         return done(err);
       })
    }).finally(function(){
      // clean up after ourselves by deleting downloading directories & keys
      fse.removeSync(path.resolve(appRoot.path, '/tmp/' + jobId));
      fse.removeSync(path.resolve(appRoot.path, '/tmp/keys/' + jobId));
    });
});

/*
* Send email to job owner
*/
exports.sendMail = function(jobId, subject, text){
 var job = queue.create('sendMail', {
   jobId: jobId,
   subject: subject,
   text: text,
   title: jobId
 });

 job
   .on('enqueue', function (){
     logger.info('[queue] email job has been added to the queue.');
   })
   .on('complete', function (){
     logger.info('[queue] email job exited the queue successfully.');
   })
   .on('failed', function (err){
     logger.info('[queue] email job failed in the queue with the following error: ' + err);
   })
 job.save();
}

queue.process('sendMail', function (job, done){
  app.models.Job.findById(job.data.jobId, {include: ['user']}, function(err, rec){
    if (!err && rec) {
      var jobId = job.data.jobId;
      try {
        if (process.env.NODE_ENV === 'production' && rec.notification === 'email') {
          logger.info('[job-'+jobId+'][queue] sending job email to ' + rec.user().email);
          sendgrid.send({
            to:       rec.user().email,
            from:     'Thurgood',
            subject:  job.data.subject,
            text:     job.data.text
          }, function(err, json) {
            if (!err) {
              logger.info('[job-'+jobId+'] email sent to ' + to + ' with subject: ' + subject);
              done(null, 'Email sent.');
            } else {
              logger.error('[job-'+jobId+'] error sending with sendgrid: ' + err);
              done(err);
            }
          });
        } else {
          logger.info('[job-'+jobId+'][queue] sending job email to ' + rec.user().email);
          done(null, 'Email sent.');
        }
      } catch(error) {
        done(error);
      }
    }
    if (err) done(err);
  });
});

/*
* Submit test job for processing
*/
exports.submitTest = function(job){
 var job = queue.create('test', {
   job: job
 });

 job
   .on('enqueue', function (){
     logger.info('[test] job has been added to the queue.');
   })
   .on('complete', function (){
     logger.info('[test] job exited the queue successfully.');
   })
   .on('failed', function (err){
     logger.info('[test] job failed in the queue with the following error: ' + err);
   })
 job.save();
}

queue.process('test', function (job, done){
  logger.info('[test] submitted successfully and finished processing');
  done && done();
});
