'use strict'

var Promise = require("bluebird");
var logger = require('strong-logger');
var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var request = require('request');
var AdmZip = require('adm-zip');
var path = require("path");
var fse = Promise.promisifyAll(require('fs-extra'));
var github = require('../../server/libs/github');

module.exports = function(Job) {

  /**
   * Returns the job by id from MongoDB.
   * Loopback doesn't support promises at this time :(
   *
   * @param <String> id
   * @return <Job> job
   */
  var findJobById = function(id) {
    return new Promise(function(resolve, reject) {
      Job.findById(id, function(err, job){
        if (err) reject(err);
        if (!err) resolve(job);
      });
    });
  };

  /**
   * Returns the server for the specified job from MongoDB.
   *
   * @param <String> id
   * @return <Server> server
   */
  var findServerByJob = function(job) {
    return new Promise(function(resolve, reject) {
      var Server = Job.app.models.Server;
      Server.findOne({ where: {jobId: job.id}}, function(err, server){
        if (err) reject(err);
        if (!err) resolve(server);
      });
    });
  };

  /**
   * Updates the job in MongoDB with the passed attributes.
   *
   * @param <Job> job
   * @param <Object> attributes to be updated
   * @return <Job> job
   */
  var updateJob = function(job, attributes) {
    return new Promise(function(resolve, reject) {
      job.updateAttributes(attributes, function(err, job){
        if (err) reject(err);
        if (!err) resolve(job);
      });
    });
  };

  /**
   * Reserves a server for processing, only if the platform is
   * 'Salesforce' and the steps is 'all' (meaning scan & deploy
   * to a DE org for testing).
   *
   * @param <Job> job
   * @return <Job> job
   */
  var reserveServer = function(job) {
    return new Promise(function(resolve, reject) {
      // only reserve server if Salesforce
      if (job.platform === 'Salesforce' && job.steps === 'all') {
        var Server = Job.app.models.Server;
        Server.findOne({ where: {and: [{platform: job.platform}, {status: 'available'}]}}, function(err, server){
          if (server) {
            server.updateAttributes({jobId: job.id, status: 'reserved', updatedAt: new Date()}, function(err, server){
              if (err) reject(err);
              if (!err) resolve(job);
            });
          }
          if (!server) reject('no server available');
        });
      } else {
        resolve(job);
      }
    });
  };

  /**
   * Updates the server and marks it available.
   *
   * @param <Server> server
   * @return <Server> server
   */
  var releaseServer = function(server) {
    return new Promise(function(resolve, reject) {
      server.updateAttributes({jobId: null, status: 'available', updatedAt: new Date()}, function(err, server){
        if (err) reject(err);
        if (!err) resolve(server);
      });
    });
  };

  /**
   * Sends 'Job Complete' notification if mode is production.
   *
   * @param <Job> job
   * @return <Job> job
   */
  var sendMail = function(job) {
    return new Promise(function(resolve, reject) {
      if (process.env.NODE_ENV === 'production' && job.notification === 'email') {
        sendgrid.send({
          to:       job.user().email,
          from:     'Thurgood',
          subject:  'Job ' + job.id + ' Complete',
          text:     'Your Thurgood job has been completed. You can view the job logs at ' + process.env.APP_URL + '/#/jobs/'+job.id+'/events.'
        }, function(err, json) {
          if (err) reject(err);
          if (!err) resolve(job);
        });
      } else {
        resolve(job);
      }
    });
  };

  /**
   * Downloads the job's zip file and upzips it into a tmp dir.
   *
   * @param <Job> job
   * @return <Job> job
   */
  var downloadZip = function(job) {
    return new Promise(function(resolve, reject) {
      // create the job directory
      var dir = path.resolve(__dirname, '../../tmp/' + job.id);
      fse.ensureDirAsync(path.resolve(__dirname, dir));

      // download and upzip all contents
      var download = request(job.codeUrl)
        .pipe(fse.createWriteStream('tmp/' + job.id + '/archive.zip'));
      download.on('finish', function(){
        logger.info('[job-'+job.id+'] code successfully downloaded.');
        try {
          var zip = new AdmZip('tmp/' + job.id + '/archive.zip');
          zip.extractAllTo('tmp/' + job.id, true);
          logger.info('[job-'+job.id+'] code successfully unzipped.');
          // delete the archive file so it doesn't get pushed
          fse.delete(dir + "/archive.zip");
          resolve(job);
        } catch (err) {
          reject(err);
        }
      })
    });
  }

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
  Job.submit = function(id, cb) {
    findJobById(id)
       .then(reserveServer)
       .then(downloadZip)
       .then(github.push)
       .then(function(job) {
         updateJob(job, {status: 'in progress', startTime: new Date(), endTime: null, updatedAt: new Date()})
           .then(function(job) {
             cb(null, job);
           })
       }).catch(function(err) {
         if (err === 'no server available') {
           logger.warn('[job-'+id+'] ' + err);
           var msg = {
             id: id,
             success: false,
             message: 'No Salesforce servers available for processing at this time. Please submit your job later.'
           }
           cb(null, msg);
         } else {
           logger.error('[job-'+id+'] ' + err);
           cb(err)
         }
       }).finally(function(){
         // clean up after ourselves by deleting downloading directories
         var repoDir = path.resolve(__dirname, '../../tmp/' + id);
         var keysDir = path.resolve(__dirname, '../../tmp/keys/' + id);
         fse.delete(repoDir, function (err) {
           if (err) logger.fatal('[job-'+job.id+'] error deleting repo directory:' + err);
         });
         fse.delete(keysDir, function (err) {
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
      description: 'Marks a job as complete & releases server.'
    }
  );

  // the actual function called by the route to do the work
  Job.complete = function(id, cb) {

    Job.findOne({ where: {id: id}, include: 'user'}, function(err, job){
      if (err) cb(err);
      if (!err) {
        updateJob(job, {status: 'complete', endTime: new Date(), updatedAt: new Date()})
          .then(sendMail)
          .then(findServerByJob)
          .then(releaseServer)
          .then(function(server) {
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
