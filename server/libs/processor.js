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
var ThurgoodException = require('../../server/libs/exception');

var app = require('../../server/server.js');

module.exports = {

  /**
   * Returns the job by id from MongoDB.
   * Loopback doesn't support promises at this time :(
   *
   * @param <String> id
   * @return <Job> job
   */
  findJobById: function(id) {
    return new Promise(function(resolve, reject) {
      app.models.Job.findById(id, {include: 'server'}, function(err, job){
        if (!err && job) {
          resolve(job);
        } else {
          if (err) reject(err);
          if (!err) reject('job not found with Id: ' + id);
        }
      });
    });
  },

  /**
   * Updates the job in MongoDB with the passed attributes.
   *
   * @param <Job> job
   * @param <Object> attributes to be updated
   * @return <Job> job
   */
  updateJob: function(job, attributes) {
    return new Promise(function(resolve, reject) {
      job.updateAttributes(attributes, function(err, job){
        if (err) reject(err);
        if (!err) resolve(job);
      });
    });
  },

  /**
   * Reserves a server for processing, only if the platform is
   * 'Salesforce' and the steps is 'all' (meaning scan & deploy
   * to a DE org for testing).
   *
   * @param <Job> job
   * @return <Job> job
   */
  reserveServer: function(job) {
    return new Promise(function(resolve, reject) {
      app.models.Server.findOne({ where: {and: [{platform: job.platform}, {status: 'available'}]}}, function(err, server){
        if (server) {
          server.updateAttributes({jobId: job.id, status: 'reserved', updatedAt: new Date()}, function(err, server){
            if (err) reject(err);
            if (!err) {
              app.models.Job.findById(job.id, {include: 'server'}, function(err, job){
                resolve(job);
              });
            }
          });
        }
        if (!server) reject(new ThurgoodException('NO_SERVER_AVAILABLE'));
      });
    });
  },

  /**
   * Updates the server and marks it available.
   *
   * @param <Job> job
   * @return <Job> job
   */
  releaseServer: function(job) {
    return new Promise(function(resolve, reject) {
      app.models.Server.findOne({where: {jobId: job.id}}, function(err, server){
        if (server && !err) {
          server.updateAttributes({jobId: null, status: 'available', updatedAt: new Date()}, function(err, server){
            if (err) reject(err);
            if (!err) {
              app.models.Job.findById(job.id, {include: 'server'}, function(err, job){
                resolve(job);
              });
            }
          });
        } else {
          if (err) reject(err);
          if (!err) reject('server not found for job with Id: ' + job.id);
        }
      });
    });
  },

  /**
   * Downloads the job's zip file and upzips it into a tmp dir.
   *
   * @param <Job> job
   * @return <Job> job
   */
  downloadZip: function(job) {
    return new Promise(function(resolve, reject) {
      // create the job directory
      var dir = path.resolve(__dirname, '../../tmp/' + job.id.toString());
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
  },

  /**
   * Sends 'Job Complete' notification if mode is production.
   *
   * @param <Job> job
   * @return <Job> job
   */
  sendMail: function(job) {
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
  },

  /**
   * Rolls back the job to 'created' state and releases the server
   * Method implements 'callback hell' since Loopback doesn't
   * support promises
   *
   * @param <String> id
   * @return <Job> job
   */
  rollback: function(id) {
    return new Promise(function(resolve, reject) {
      app.models.Job.findById(id, {include: 'server'}, function(err, job){
        var attributes = {
          status: 'created',
          startTime: null,
          endTime: null,
          updatedAt: new Date()
        }
        job.updateAttributes(attributes, function(err, job){
          if (err) reject(err);
          if (!err) {
            app.models.Server.findOne({where: {jobId: id}}, function(err, server){
              if (err) reject(err);
              if (server && !err) {
                var attributes = {
                  jobId: null,
                  status: 'available',
                  updatedAt: new Date()
                }
                server.updateAttributes(attributes, function(err, server){
                  if (err) reject(err);
                  if (!err) {
                    app.models.Job.findById(id, {include: 'server'}, function(err, job){
                      resolve(job);
                    });
                  };
                });
              }
            });
          }
        });
      });
    });
  },

}
