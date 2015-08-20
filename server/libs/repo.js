'use strict'

var app = require('../../server/server.js');
var Promise = require("bluebird");
var fse = Promise.promisifyAll(require('fs-extra'));
var path = require("path");
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
      var repoDir = path.resolve(__dirname, '../../tmp/' + job.id.toString());
      var settings = {
        JOB_ID: job.id,
        SFDC_DEPLOY: job.platform.toLowerCase() === 'salesforce' && job.steps.toLowerCase() === 'all'
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
      if (job.platform.toLowerCase() === 'salesforce' && job.steps.toLowerCase() === 'all') {
        var repoDir = path.resolve(__dirname, '../../tmp/' + job.id.toString());
        app.models.Server.findOne({ where: {jobId: job.id}}, function(err, server){
          if (!server) reject('Server not found for job');
          if (server) {
            var settings = {
              'sf.username': server.username,
              'sf.password': server.password,
              'sf.serverurl': server.instanceUrl
            };
            properties.stringify(settings, {path: repoDir + '/build.properties'}, function(err, results) {
              if (err) reject(err);
              if (!err) resolve(job);
            });
          }
        });
      } else {
        resolve(job);
      }
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
      if (job.platform.toLowerCase() === 'salesforce' && job.steps.toLowerCase() === 'all') {
        var repoDir = path.resolve(__dirname, '../../tmp/' + job.id.toString());
        var apexDir = path.resolve(__dirname, '../../shells/apex');
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
