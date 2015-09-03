'use strict'

var app = require('../../server/server.js');
var Promise = require("bluebird");
var fse = Promise.promisifyAll(require('fs-extra'));
var path = require("path");
var appRoot = require('app-root-path');
var properties = require ("properties");

module.exports = {

  /**
   * Writes the job.properties file to the tmp directory with
   * settings used by jenkins.
   *
   * @param <Job> job
   * @return <Job> job
   */
  addJobProperties: function(job) {
    return new Promise(function(resolve, reject) {
      var repoDir = path.resolve(appRoot.path, '/tmp/' + job.id.toString());
      var settings = {
        JOB_ID: job.id,
        THURGOOD_URL: process.env.APP_URL,
        SFDC_DEPLOY: job.type.toLowerCase() === 'salesforce' && job.steps.toLowerCase() === 'all'
      };
      properties.stringify(settings, {path: repoDir + '/job.properties'}, function(err, results) {
        if (err) reject(err);
        if (!err) resolve(job);
      });
    });
  },

  /**
   * Writes the build.properties file to the tmp directory with
   * salesforce ant build info.
   *
   * @param <Job> job
   * @return <Job> job
   */
  addBuildProperties: function(job) {
    return new Promise(function(resolve, reject) {
      app.models.Job.findById(job.id, {include: ['environment','user']}, function(err, job){
        if (!err && job) {
          if (job.type.toLowerCase() === 'salesforce' && job.steps.toLowerCase() === 'all') {
            var repoDir = path.resolve(appRoot.path, '/tmp/' + job.id.toString());
            if (job.environment){
              var settings = {
                'sf.username': job.environment().username,
                'sf.password': job.environment().password,
                'sf.serverurl': job.environment().instanceUrl
              };
              properties.stringify(settings, {path: repoDir + '/build.properties'}, function(err, results) {
                if (err) reject(err);
                if (!err) resolve(job);
              });
            } else {
              reject('No environment assigned to job');
            }
          } else {
            resolve(job);
          }
        }
        if (err) reject(err);
      });
    });
  },

  /**
   * Adds the required shell files the directory
   *
   * @param <Job> job
   * @return <Job> job
   */
  addShellAssets: function(job) {
    return new Promise(function(resolve, reject) {
      if (job.type.toLowerCase() === 'salesforce' && job.steps.toLowerCase() === 'all') {
        var repoDir = path.resolve(appRoot.path, '/tmp/' + job.id.toString());
        var apexDir = path.resolve(appRoot.path, 'shells/apex');
        fse.copyAsync(apexDir + '/lib', repoDir + '/lib')
          .then(fse.copyAsync(apexDir + '/undeploy', repoDir + '/undeploy'))
          .then(fse.copyAsync(apexDir + '/build.xml', repoDir + '/build.xml'))
          .then(fse.copyAsync(apexDir + '/log4j.xml', repoDir + '/log4j.xml'))
          .then(function() {
            resolve(job);
          });
      } else {
        resolve(job);
      }
    });
  }

}
