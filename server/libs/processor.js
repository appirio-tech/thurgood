'use strict'

var Promise = require("bluebird");
var logger = require('strong-logger');
var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var request = require('request');
var AdmZip = require('adm-zip');
var path = require("path");
var appRoot = require('app-root-path');
var fse = Promise.promisifyAll(require('fs-extra'));
var ThurgoodException = require('../../server/libs/exception');
var pt = require('../../server/libs/papertrail');

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
      app.models.Job.findById(id, {include: ['environment','user']}, function(err, job){
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
      app.models.Job.findById(job.id, function(err, job){
        if (err) reject(err);
        if (!err) {
          job.updateAttributes(attributes, function(err, job){
            if (err) reject(err);
            if (!err) resolve(job);
          });
        }
      });
    });
  },

  /**
   * Reserves an environment for processing, only if the type is
   * 'Salesforce' and the steps is 'all' (meaning scan & deploy
   * to a DE org for testing).
   *
   * @param <Job> job
   * @return <Job> job
   */
  reserveEnvironment: function(job) {
    return new Promise(function(resolve, reject) {
      app.models.Environment.findOne({ where: {and: [{type: job.type}, {status: 'available'}]}}, function(err, environment){
        if (environment) {
          environment.updateAttributes({jobId: job.id, status: 'reserved', updatedAt: new Date()}, function(err, environment){
            if (err) reject(err);
            if (!err) {
              app.models.Job.findById(job.id, {include: ['environment','user']}, function(err, job){
                resolve(job);
              });
            }
          });
        }
        if (!environment) reject(new ThurgoodException('NO_ENVIRONMENT_AVAILABLE'));
      });
    });
  },

  /**
   * Updates the environment and marks it available.
   *
   * @param <Job> job
   * @return <Job> job
   */
  releaseEnvironment: function(job) {
    return new Promise(function(resolve, reject) {
      app.models.Environment.findOne({where: {jobId: job.id}}, function(err, environment){
        if (environment && !err) {
          environment.updateAttributes({jobId: null, status: 'available', updatedAt: new Date()}, function(err, environment){
            if (err) reject(err);
            if (!err) {
              app.models.Job.findById(job.id, {include: ['environment','user']}, function(err, job){
                resolve(job);
              });
            }
          });
        } else {
          if (err) reject(err);
          if (!err) reject('environment not found for job with Id: ' + job.id);
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

    var githubRootFolder = function(folder) {
      return new Promise(function(resolve, reject) {
        fse.readdirAsync(folder)
          .then(function(files){
            files.map(function(filename){
              var file = path.resolve(folder, filename);
              fse.statAsync(file)
                .then(function(stats){
                  if (stats.isDirectory()) resolve(file);
                });
            });
          });
      });
    };

    return new Promise(function(resolve, reject) {
      // create the job directory
      var dir = path.resolve(appRoot.path, '/tmp/' + job.id.toString());
      fse.ensureDirAsync(path.resolve(__dirname, dir));

      // download and upzip all contents
      var download = request(job.codeUrl)
        .pipe(fse.createWriteStream(dir + '/archive.zip'));
      download.on('finish', function(){
        pt.log('[thurgood] code successfully downloaded.', job.id);
        logger.info('[job-'+job.id+'] code successfully downloaded.');
        try {
          var zip = new AdmZip(dir + '/archive.zip');
          zip.extractAllTo(dir, true);
          pt.log('[thurgood] code successfully unzipped.', job.id);
          logger.info('[job-'+job.id+'] code successfully unzipped.');
          // delete the archive file so it doesn't get pushed
          fse.removeSync(dir + "/archive.zip");
          /* See if the code is from github and them move
          * the contents up a folder. When the zip is downloaded
          * from github it is buried inside a folder named after
          * the branch. So the file will be in something like
          * '/tmp/job1/push-test-master' instead of '/tmp/job1'.
          * We need to move everything up into the tmp dir for
          * for the project so it is a consistent structure.
          */
          if (job.codeUrl.split('/')[2].indexOf('github.com') != -1) {
            githubRootFolder(dir)
              .then(function(githubDir){
                fse.copySync(githubDir, dir, {clobber: true});
                fse.removeSync(githubDir);
                fse.removeSync(path.resolve(dir, '__MACOSX'));
                resolve(job);
              })
          } else {
            // try and delete a '__MACOSX' if it exists
            fse.removeSync(path.resolve(dir, '__MACOSX'));
            resolve(job);
          }
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
  sendJobCompleteMail: function(job) {
    return new Promise(function(resolve, reject) {
      if (process.env.NODE_ENV === 'production' && job.notification === 'email') {
        var subject = 'Job ' + job.id + ' Complete';
        var text = 'Your Thurgood job has been completed. You can view the job logs at ' + process.env.APP_URL + '/#/jobs/'+job.id+'/events.'
        mailer(job.id, job.user().email, subject, text)
          .then(function(){
            resolve(job);
          })
      } else {
        logger.info('[job-'+job.id+'][fake] sending job complete email to ' + job.user().email);
        resolve(job);
      }
    });
  },

  /**
   * Sends 'Job in Progress' notification if mode is production.
   *
   * @param <Job> job
   * @return <Job> job
   */
  sendJobSubmittedMail: function(job) {
    return new Promise(function(resolve, reject) {
      if (process.env.NODE_ENV === 'production') {
        var subject = 'Job ' + job.id + ' in Process';
        var text = 'Congrats! Your Thurgood job is now in process. You can view the job logs at ' + process.env.APP_URL + '/#/jobs/'+job.id+'/events.'
        mailer(job.id, job.user().email, subject, text)
          .then(function(){
            resolve(job);
          })
      } else {
        logger.info('[job-'+job.id+'][fake] sending job in process email to ' + job.user().email);
        resolve(job);
      }
    });
  },

  /**
   * Sends 'Job Error' notification if mode is production.
   *
   * @param <Job> job
   * @return <Job> job
   */
  sendJobErrorMail: function(jobId) {
    return new Promise(function(resolve, reject) {
      if (process.env.NODE_ENV === 'production') {
        app.models.Job.findById(jobId, {include: ['user']}, function(err, job){
          if (!err && job) {
            var subject = 'Error! Job ' + jobId;
            var text = 'Drats! An error occurred while processing your job.  You can view the job logs at ' + process.env.APP_URL + '/#/jobs/'+jobId+'/events.'
            mailer(job.id, job.user().email, subject, text)
              .then(function(){
                resolve(jobId);
              })
          }
          if (err) reject(err);
        });
      } else {
        logger.info('[job-'+job.id+'][fake] sending job error email to ' + job.user().email);
        resolve(job);
      }
    });
  },

  /**
   * Rolls back the job to 'created' state and releases the environment
   * Method implements 'callback hell' since Loopback doesn't
   * support promises
   *
   * @param <String> id
   * @return <Job> job
   */
  rollback: function(id) {
    return new Promise(function(resolve, reject) {
      app.models.Job.findById(id, {include: ['environment','user']}, function(err, job){
        var attributes = {
          status: 'created',
          startTime: null,
          endTime: null,
          updatedAt: new Date()
        }
        job.updateAttributes(attributes, function(err, job){
          if (err) reject(err);
          if (!err) {
            app.models.Environment.findOne({where: {jobId: id}}, function(err, environment){
              if (err) reject(err);
              if (environment && !err) {
                var attributes = {
                  jobId: null,
                  status: 'available',
                  updatedAt: new Date()
                }
                environment.updateAttributes(attributes, function(err, environment){
                  if (err) reject(err);
                  if (!err) resolve(id);
                });
              }
            });
          }
        });
      });
    });
  },

}

var mailer = function(jobId, to, subject, text){
  return new Promise(function(resolve, reject) {
    sendgrid.send({
      to:       to,
      from:     'Thurgood',
      subject:  subject,
      text:     text
    }, function(err, json) {
      if (err) reject(err);
      if (!err) {
        logger.info('[job-'+jobId+'] email sent to ' + to + ' with subject: ' + subject);
        resolve;
      }
    });
  });
}
