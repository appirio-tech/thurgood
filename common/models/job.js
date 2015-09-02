'use strict'

var Promise = require("bluebird");
var logger = require('strong-logger');
var path = require("path");
var processor = require('../../server/libs/processor');
var queue = require('../../server/libs/jobQueue');
var ThurgoodException = require('../../server/libs/exception');
var pt = require('../../server/libs/papertrail');

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
      if (!err && job) {
        pt.log('[' +sender+ '] ' + message, job.id);
        logger.info('[job-'+job.id+']['+sender+'] ' + message);
        var msg = {
          success: true,
          message: 'Message sent to logger'
        }
        cb(null, msg);
      } else {
        logger.error('[job-'+id+']['+sender+'] could not find job for message!!');
        var msg = {
          success: false,
          message: 'Job not found for message'
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
  Job.submit = function(id, cb) {
    processor.findJobById(id)
     .then(function(job){
       if (job.status === 'in progress') throw new ThurgoodException('IN_PROGRESS');
       return job;
     })
     .then(processor.reserveEnvironment)
     .then(function(job) {
       // push to queue if not in test environment (mocha)
       if (process.env.NODE_ENV !== 'test') queue.submitJob(job);
       processor.updateJob(job, {status: 'in progress', startTime: new Date(), endTime: null, updatedAt: new Date()})
         .then(function(job) {
           var msg = {
             id: job.id,
             success: true,
             message: 'Job in progress',
             job: job
           }
           pt.log('[thurgood] job submitted for processing.', job.id);
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
         pt.log('[thurgood] job submitted but: ' + msg.message, id);
       } else {
         pt.log('[thurgood] job submitted but error: ' + err, id);
         logger.error('[job-'+id+'] ' + err);
         cb(err)
       }
     });
  };

  // Register a 'complete' remote method: /jobs/some-id/complete
  Job.remoteMethod(
    'complete',
    {
      http: {path: '/:id/complete', verb: 'put'},
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
          .then(processor.sendJobCompleteMail)
          .then(function(job) {
            pt.log('[thurgood] job marked as complete.', id);
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
