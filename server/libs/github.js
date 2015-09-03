'use strict'

var keygen = require('ssh-keygen');
var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var logger = require('strong-logger');
var nodegit = require('nodegit');
var path = require("path");
var fse = Promise.promisifyAll(require('fs-extra'));
var _ = require('lodash');
var GitHubApi = require("github");
var pt = require('../../server/libs/papertrail');
var appRoot = require('app-root-path');

module.exports = {

  /**
   * Pushes code in job tmp directory to github. Creates
   * a one-time SSH key for Github, creates a new git
   * repo, pushes repo to github and deletes the SSH
   * key from Github. Also deletes the repo code and
   * SSH keys locally from tmp directory.
   *
   * @param <Job> job
   * @return <Job> job
   */
  push: function(job) {
    return new Promise(function(resolve, reject) {
      var repoDir = path.resolve(appRoot.path, '/tmp/', job.id.toString());
      var keysDir = path.resolve(appRoot.path, '/tmp/keys/', job.id.toString());
      var repository = nodegit.Repository.init(repoDir, 0);
      var remote;
      var index;

      logger.info('[job-'+job.id+'] creating local git repo.');
      pt.log('[thurgood] creating local git repo.', job.id);

      createSshKeys(job)
      .then(function(keys) {
        // save the keys locally for the auth later
        fse.ensureDirAsync(keysDir)
        .then(function() {
          fse.writeFileAsync(keysDir + '/id_thurgood.pub', keys.public);
          fse.writeFileAsync(keysDir + '/id_thurgood', keys.private);
          return;
        })
      })
      .then(function() {
        return nodegit.Repository.init(repoDir, 0);
      })
      .then(function(repo) {
        repository = repo;
        return repository.openIndex();
      })
      .then(function(idx) {
        index = idx;
        index.read(1);
        return index.addAll(repoDir);
      })
      .then(function() {
        index.write();
        return index.writeTree();
      })
      .then(function(oid) {
        var now = Math.round(Date.now() / 1000);
        var author = nodegit.Signature.create("Thurgood", "thurgood@appirio.com", now, 0);
        var committer = nodegit.Signature.create("Thurgood","thurgood@appirio.com", now, 0);
        return repository.createCommit("HEAD", author, committer, "Commit courtesy of Thurgood!", oid, []);
      })
      .then(function(){
        return nodegit.Remote.create(repository, "origin", job.environment().repo);
      })
      .then(function(remoteResult){
        logger.info('[job-'+job.id+'] pushing code to github.');
        pt.log('[thurgood] pushing code to github.', job.id);
        remote = remoteResult;
        remote.setCallbacks({
          credentials: function(url, userName) {
            return nodegit.Cred.sshKeyNew(
              userName,
              keysDir + '/id_thurgood.pub',
              keysDir + '/id_thurgood',
              process.env.GITHUB_SECRET); // this is the password from the keygen function
          }
        });
        return remote.connect(nodegit.Enums.DIRECTION.PUSH);
      })
      .then(function() {
        return remote.push(
            ["+refs/heads/master:refs/heads/master"],
            null,
            repository.defaultSignature(),
            "Push to master")
      })
      .then(function(result) {
        pt.log('[thurgood] code pushed to github.', job.id);
        logger.info('[job-'+job.id+'] code pushed to github.');
        resolve(job);
      })
      .catch(function(err) {
        logger.error('[job-'+job.id+'] ' + err);
        reject(err)
      })
      .finally(function() {
        removeSshKey(job);
      });

    });
  }

}

/**
 * Creates a one-time SSH key on Github for the job.
 *
 * @param <Job> job
 * @return <Job> job
 */
var createSshKeys = function(job) {
  return new Promise(function(resolve, reject) {

    var github = new GitHubApi({
        version: "3.0.0",
        headers: { "user-agent": "thurgood" }
    });

    github.authenticate({
      type: "basic",
      username: process.env.GITHUB_USERNAME,
      password: process.env.GITHUB_PASSWORD
    });

    keygen({
      password: process.env.GITHUB_SECRET, // generic password
      read: true
    }, function(err, out){
      if (err) reject(err);
      if (!err) {

        var msg = {
          title: job.id,
          key: out.pubKey
        }

        github.user.createKey(msg, function(err, res) {
          if (err) reject(err);
          if (!err) {
            var keys = {
              private: out.key,
              public: out.pubKey
            };
            resolve(keys);
          }
        });
      }
    });
  });
};

/**
 * Deletes the one-time SSH key from Github for the job.
 *
 * @param <Job> job
 * @return <Job> job
 */
var removeSshKey = function(job) {

  var github = new GitHubApi({
    version: "3.0.0",
    headers: { "user-agent": "thurgood" }
  });

  github.authenticate({
      type: "basic",
      username: process.env.GITHUB_USERNAME,
      password: process.env.GITHUB_PASSWORD
  });

  github.user.getKeys({}, function(err, res) {
    _.forEach(res, function(key) {
      if (key.title === job.id) {
        github.user.deleteKey({ id: key.id });
      }
    })
  });

}
