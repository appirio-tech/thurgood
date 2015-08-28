var app = require('../server/server.js');
var Promise = require("bluebird");
var Environment = app.models.Environment;
var Job = app.models.Job;
var User = app.models.User;
var Project = app.models.Project;

var thurgoodUserId;

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
        name: "bad-zip-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-production.s3.amazonaws.com/bad-zip.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "bad-zip-job",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "message-job",
        name: "message-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "other",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "in progress",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "complete-job",
        name: "complete-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "other",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "in progress",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "success-submit-job",
        name: "success-submit-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "salesforce",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "no-environments-job",
        name: "no-environments-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "salesforce",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "processor-reserve-job",
        name: "processor-reserve-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "appengine", // doesn't really matter
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "processor-reserve-release-job",
        name: "processor-reserve-release-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "openshift", // doesn't really matter
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "processor-no-environment-available-job",
        name: "processor-no-environment-available-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "bad-type",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "download-zip-job",
        name: "download-zip-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "bad-type",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "rollback-job",
        name: "rollback-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "http://cs-thurgood.s3.amazonaws.com/sfdc-test-thurgood-src.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "rollback",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "in progress",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId
      },
      {
        id: "webhook-job",
        name: "webhook-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "https://github.com/jeffdonthemic/push-test/archive/master.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "webhook",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId,
        projectId: 'webhook-project'
      },
      {
        id: "github-webhook-job",
        name: "github-webhook-job",
        name: "github-webhook-job",
        createdAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        codeUrl: "https://github.com/jeffdonthemic/push-test/archive/master.zip",
        endTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        type: "github-webhook",
        startTime: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 11:10:03 GMT-0600 (MDT)",
        status: "created",
        notification: "email",
        steps: "all",
        userId: thurgoodUserId,
        projectId: 'github-webhook-project'
      },
    ], function(err, records) {
      if (err) reject(err);
      if (!err) resolve(records);
    });
  });
};

var createEnvironments = function(users) {
  return new Promise(function(resolve, reject) {
    Environment.create([
      {
        id: "bad-zip-environment",
        instanceUrl: "http://www.force.com",
        name: "DE Org 1",
        password: "111111",
        type: "bad-zip-job",
        repo: "git@github.com:thurgoodpush/mocha-test",
        status: "available",
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "steve",
        jobId: 'bad-zip-job'
      },
      {
        id: "complete-environment",
        instanceUrl: "http://www.myjavaenvironment.com",
        name: "Java Environment 1",
        password: "234567",
        type: "other",
        repo: "git@github.com:thurgoodpush/mocha-test",
        status: "reserved",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff",
        jobId: "complete-job"
      },
      {
        id: "success-submit-environment",
        instanceUrl: "https://login.salesforce.com",
        name: "Java Environment 1",
        password: "234567",
        type: "salesforce",
        repo: "git@github.com:thurgoodpush/mocha-test",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff",
        jobId: 'success-submit-job'
      },
      {
        id: "processor-reserve-environment",
        instanceUrl: "http://www.myjavaenvironment.com",
        name: "Java Environment 1",
        password: "234567",
        type: "appengine",
        repo: "git@github.com:thurgoodpush/mocha-test",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff"
      },
      {
        id: "processor-reserve-release-environment",
        instanceUrl: "http://www.myjavaenvironment.com",
        name: "Java Environment 1",
        password: "234567",
        type: "openshift",
        repo: "git@github.com:thurgoodpush/mocha-test",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff"
      },
      {
        id: "rollback-environment",
        instanceUrl: "http://www.myjavaenvironment.com",
        name: "Java Environment 1",
        password: "234567",
        type: "rollback",
        repo: "git@github.com:jeffdonthemic/push-test.git",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff",
        jobId: 'rollback-job'
      },
      {
        id: "webhook-environment",
        instanceUrl: "http://www.myjavaenvironment.com",
        name: "Java Environment 1",
        password: "234567",
        type: "webhook",
        repo: "git@github.com:thurgoodpush/mocha-test",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff"
      },
      {
        id: "github-webhook-environment",
        instanceUrl: "http://www.myjavaenvironment.com",
        name: "Java Environment 1",
        password: "234567",
        type: "github-webhook",
        repo: "git@github.com:thurgoodpush/mocha-test",
        status: "available",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        username: "jeff",
      },
    ], function(err, records) {
      if (err) reject(err);
      if (!err) resolve(users);
    });
  });
};

var createProjects = function() {
  return new Promise(function(resolve, reject) {
    Project.create([
      {
        id: 'webhook-project',
        name: 'Webhook Project',
        repo: 'jeffdonthemic/push-test',
        description: 'Test project',
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        userId: thurgoodUserId
      },
      {
        id: 'github-webhook-project',
        name: 'Webhook Project',
        repo: 'jeffdonthemic/github-push-test',
        description: 'Test project',
        createdAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        updatedAt: "Mon Jul 13 2015 10:34:59 GMT-0600 (MDT)",
        userId: thurgoodUserId,
        jobId: 'github-webhook-environment'
      }
    ], function(err, records) {
      if (err) reject(err);
      if (!err) resolve(records);
    });
  });
};

before(function(done) {

  User.findOne({where: {username: 'thurgood'}}, function(err, user) {
    // set the admin user id so it can be used setup data
    thurgoodUserId = user.id;
    createUsers()
      .then(function(users) {
        createProjects();
      })
      .then(function() {
        createJobs();
      })
      .then(function(jobs) {
        createEnvironments(jobs);
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

  });
})

after(function(done) {
   Environment.destroyAll();
   Job.destroyAll();
   User.destroyAll();
   Project.destroyAll();
   done();
})
