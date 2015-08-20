var app = require('../server/server.js');
var Promise = require("bluebird");
var Server = app.models.Server;
var Job = app.models.Job;
var User = app.models.User;


var createUsers = function() {
  return new Promise(function(resolve, reject) {
    User.create([
      {
        id: 'test-user1',
        username: 'test-user1',
        email: 'test-user1@appirio.com',
        password: 'password',
      },
      {
        id: 'test-user2',
        username: 'test-user2',
        email: 'test-user2@appirio.com',
        password: 'password',
      }
    ], function(err, records) {
      if (err) reject(err);
      if (!err) resolve(records);
    });
  });
};

var createJobs = function() {
  return new Promise(function(resolve, reject) {
    Job.create([
      {
        id: "bad-zip-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-production.s3.amazonaws.com/bad-zip.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "other",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "message-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "other",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "in progress",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "complete-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "other",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "in progress",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "success-submit-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "salesforce",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "created",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "no-servers-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "salesforce",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "created",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "processor-reserve-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "appengine", // doesn't really matter
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "created",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "processor-reserve-release-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "openshift", // doesn't really matter
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "created",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "processor-no-server-available-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "bad-platform",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "created",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "download-zip-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "bad-platform",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "created",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "rollback-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "rollback",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "in progress",
        notification: "email",
        steps: "all",
        userId: 1
      },
    ], function(err, records) {
      if (err) reject(err);
      if (!err) resolve(records);
    });
  });
};

var createServers = function(users) {
  return new Promise(function(resolve, reject) {
    Server.create([
      {
        id: "bad-zip-server",
        installedServices: [
          "Force.com", "MongoDB"
        ],
        instanceUrl: "http://www.force.com",
        languages: [
          "Apex", "Visualforce"
        ],
        name: "DE Org 1",
        operatingSystem: "Linux",
        password: "111111",
        platform: "other",
        repoName: "git@github.com:jeffdonthemic/push-test.git",
        status: "reserved", // setup so test suceeds for 'no servers'
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "steve",
        project: "ACME",
        jobId: 'bad-zip-job'
      },
      {
        id: "complete-server",
        installedServices: [
          "ANT", "Jetty"
        ],
        instanceUrl: "http://www.myjavaserver.com",
        languages: [
          "java"
        ],
        name: "Java Server 1",
        operatingSystem: "Linux",
        password: "234567",
        platform: "other",
        repoName: "git@github.com:jeffdonthemic/push-test.git",
        status: "reserved",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff",
        jobId: "complete-job"
      },
      {
        id: "success-submit-server",
        installedServices: [
          "ANT", "Jetty"
        ],
        instanceUrl: "http://www.myjavaserver.com",
        languages: [
          "java"
        ],
        name: "Java Server 1",
        operatingSystem: "Linux",
        password: "234567",
        platform: "salesforce",
        repoName: "git@github.com:jeffdonthemic/push-test.git",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff",
        jobId: 'success-submit-job'
      },
      {
        id: "processor-reserve-server",
        installedServices: [
          "ANT", "Jetty"
        ],
        instanceUrl: "http://www.myjavaserver.com",
        languages: [
          "java"
        ],
        name: "Java Server 1",
        operatingSystem: "Linux",
        password: "234567",
        platform: "appengine",
        repoName: "git@github.com:jeffdonthemic/push-test.git",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff"
      },
      {
        id: "processor-reserve-release-server",
        installedServices: [
          "ANT", "Jetty"
        ],
        instanceUrl: "http://www.myjavaserver.com",
        languages: [
          "java"
        ],
        name: "Java Server 1",
        operatingSystem: "Linux",
        password: "234567",
        platform: "openshift",
        repoName: "git@github.com:jeffdonthemic/push-test.git",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff"
      },
      {
        id: "rollback-server",
        installedServices: [
          "ANT", "Jetty"
        ],
        instanceUrl: "http://www.myjavaserver.com",
        languages: [
          "java"
        ],
        name: "Java Server 1",
        operatingSystem: "Linux",
        password: "234567",
        platform: "rollback",
        repoName: "git@github.com:jeffdonthemic/push-test.git",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff",
        jobId: 'rollback-job'
      },
    ], function(err, records) {
      if (err) reject(err);
      if (!err) resolve(users);
    });
  });
};

before(function(done) {

  createUsers()
    .then(function(users) {
      createJobs();
    })
    .then(function(jobs) {
      createServers(jobs);
    })
    // .then(function() {
    //   return User.find({}, function(err, users) {
    //     console.log(users);
    //   });
    // })
    .finally(function() {
      done();
    })
    .catch(function(e) {
      console.log(e);
    });
})

after(function(done) {
   Server.destroyAll();
   Job.destroyAll();
   User.destroyAll();
   done();
})
