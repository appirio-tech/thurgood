'use strict'

var Promise = require("bluebird");
var logger = require('strong-logger');
var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var request = require('request');
var AdmZip = require('adm-zip');
var path = require("path");
var properties = require ("properties");
var fse = Promise.promisifyAll(require('fs-extra'));
var github = require('../../server/libs/github');
var repo = require('../../server/libs/repo');
var processor = require('../../server/libs/processor');
var ThurgoodException = require('../../server/libs/exception');

module.exports = function(Job) {

  // Register a 'message' remote method: /jobs/some-id/message
  Job.remoteMethod(
    'message',
    {
      http: {path: '/:id/message', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'string', required: true, http: { source: 'path' }},
        {arg: 'message', type: 'string'},
        {arg: 'sender', type: 'string'}
      ],
      returns: {root: true, type: 'object'},
      description: 'Posts a message for the job.'
    }
  );

  // the actual function called by the route to do the work
  Job.message = function(id, message, sender, cb) {
    Job.findById(id, function(err, job){
      if (err) cb(err);
      if (!err) {
        logger.info('[job-'+job.id+']['+sender+'] ' + message);
        var msg = {
          success: true,
          message: 'Message sent to logger'
        }
        cb(null, msg);
      }
    });
  };

  // Register a 'submit' remote method: /jobs/some-id/submit
  Job.remoteMethod(
    'submit',
    {
      http: {path: '/:id/submit', verb: 'put'},
      accepts: {arg: 'id', type: 'string', required: true, http: { source: 'path' }},
      returns: {root: true, type: 'object'},
      description: 'Submits a job for processing.'
    }
  );

  //the actual function called by the route to do the work
  // TODO This should probably be moved to a queue
  Job.submit = function(id, cb) {
    processor.findJobById(id)
     .then(function(job){
       if (job.status === 'in progress') throw new ThurgoodException('IN_PROGRESS');
       return job;
     })
     .then(processor.reserveEnvironment)
     .then(processor.downloadZip)
     .then(repo.addJobProperties)
     .then(repo.addBuildProperties)
     .then(repo.addShellAssets)
     .then(github.push)
     .then(function(job) {
       processor.updateJob(job, {status: 'in progress', startTime: new Date(), endTime: null, updatedAt: new Date()})
         .then(function(job) {
           var msg = {
             id: job.id,
             success: true,
             message: 'Job in progress',
             job: job
           }
           logger.info('[job-'+id+'] job successfully submitted');
           cb(null, msg);
         })
     }).catch(function(err) {
       // catch some custom exceptions and handle accordingly
       if (err.name === 'ThurgoodException') {
         var msg = {
           id: id,
           success: false
         }
         if (err.message === 'NO_ENVIRONMENT_AVAILABLE') {
           msg['message'] = 'No Salesforce environments available for processing at this time. Please submit your job later.';
           logger.warn('[job-'+id+'] no environments available');
         } else if (err.message === 'IN_PROGRESS') {
           msg['message'] = 'Job already in progress. Please wait patiently.';
         }
         cb(null, msg);
       } else {
         logger.error('[job-'+id+'] ' + err);
         // rollback the job and environment to previous state if there was an error
         processor.rollback(id)
          .then(function(){
            logger.info('[job-'+id+'] environment & job rolled back due to error');
          })
          .catch(function(err){
            logger.error('[job-'+id+'] error rolling back job and releasing environment: ' + err);
          })
          .finally(function(){
            cb(err)
          })
       }
     }).finally(function(){
       // clean up after ourselves by deleting downloading directories & keys
       var repoDir = path.resolve(__dirname, '../../tmp/' + id.toString());
       var keysDir = path.resolve(__dirname, '../../tmp/keys/' + id.toString());
       fse.removeSync(repoDir, function (err) {
         if (err) logger.fatal('[job-'+job.id+'] error deleting repo directory:' + err);
       });
       fse.removeSync(keysDir, function (err) {
         if (err) logger.fatal('[job-'+job.id+'] error deleting key directory:' + err);
       });
     });
  };

  // Register a 'complete' remote method: /jobs/some-id/complete
  Job.remoteMethod(
    'complete',
    {
      http: {path: '/:id/complete', verb: 'get'},
      accepts: [
        {arg: 'id', type: 'string', required: true, http: { source: 'path' }}
      ],
      returns: {root: true, type: 'object'},
      description: 'Marks a job as complete & releases environment.'
    }
  );

  // the actual function called by the route to do the work
  Job.complete = function(id, cb) {

    Job.findOne({ where: {id: id}, include: ['user','environment']}, function(err, job){
      if (err) cb(err);
      if (!err) {
        processor.updateJob(job, {status: 'complete', endTime: new Date(), updatedAt: new Date()})
          .then(processor.releaseEnvironment)
          .then(processor.sendMail)
          .then(function(job) {
            logger.info('[job-'+job.id+'] marked as complete.');
            cb(null, job);
          }).catch(function(err) {
            logger.error('[job-'+job.id+'] ' + err);
            cb(err)
          });
      }
    });

  };

};
