'use strict'

var Promise = require("bluebird");
var logger = require('strong-logger');
var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var request = require('request');
var AdmZip = require('adm-zip');
var path = require("path");
var fse = Promise.promisifyAll(require('fs-extra'));
var github = require('../../server/libs/github');

var properties = require ("properties");

/**
* This boot script defines custom Express routes not tied to models
**/

module.exports = function(app) {

  /**
  * Defines a routes so that blogs are accessible by user
  * and slug: /jeffdonthemic/hello-world instead of id.
  **/
  app.get('/test', function(req, res) {

    var job = {
      id: 'test-job1',
      platform: 'Salesforce'
    }

    res.send('test done!');
  });

}

var addShells = function(job) {
  return new Promise(function(resolve, reject) {
    if (job.platform === 'Salesforce') {
      var repoDir = path.resolve(__dirname, '../../tmp/' + job.id);
      var apexDir = path.resolve(__dirname, '../../shells/apex');

      fse.copyAsync(apexDir + '/lib', repoDir + '/lib')
        .then(fse.copyAsync(apexDir + '/undeploy', repoDir + '/undeploy'))
        .then(fse.copyAsync(apexDir + '/build.properties', repoDir + '/build.propertie'))
        .then(fse.copyAsync(apexDir + '/build.xml', repoDir + '/build.xml'))
        .then(fse.copyAsync(apexDir + '/cloudspokes.properties', repoDir + '/cloudspokes.properties'))
        .then(fse.copyAsync(apexDir + '/log4j.xml', repoDir + '/log4j.xml'))
        .then(function() {

          properties.parse (apexDir + '/cloudspokes.properties', { path: true }, function (error, obj){
            if (error) return console.error (error);

            properties.stringify(obj, {path: apexDir + '/job.properties'}, function(error, orb) {
              console.log(error);
              console.log(obj);
              resolve(job)
            })


          });


        });
    } else {
      resolve(job);
    }
  });
}
