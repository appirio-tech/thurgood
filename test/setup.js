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

var createServers = function(users) {
  return new Promise(function(resolve, reject) {
    Server.create([
      {
        id: "test-server1",
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
        platform: "java",
        repoName: "http://www.github.com/java1",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff",
        jobId: 'test-job1'
      },
      {
        id: "test-server2",
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
        platform: "Salesforce",
        repoName: "http://www.github.com/force1",
        status: "reserved", // setup so test suceeds for 'no servers'
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "steve",
        project: "ACME"
      }
    ], function(err, records) {
      if (err) reject(err);
      if (!err) resolve(users);
    });
  });
};

var createJobs = function() {
  return new Promise(function(resolve, reject) {
    Job.create([
      {
        id: "test-job1",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "Heroku",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        project: "ACME",
        status: "in progress",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "test-job2",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-production.s3.amazonaws.com/somecode.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "Java",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "in progress",
        notification: "email",
        steps: "all",
        userId: 1
      },
      {
        id: "test-job3",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        language: "Apex",
        platform: "Salesforce",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: 1
      }
    ], function(err, records) {
      if (err) reject(err);
      if (!err) resolve(records);
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
