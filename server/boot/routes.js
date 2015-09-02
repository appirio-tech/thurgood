'use strict'

var logger = require('strong-logger');
var crypto = require('crypto');
var request = require('request');

/**
* This boot script defines custom Express routes not tied to models
**/

module.exports = function(app) {

  /**
   * Github Webhook for project notifications. Submits
   * the corresponding job for processing.
   */
  app.post('/webhook', function(req, res){
    var signedPayload = function(payload) {
      return 'sha1=' + crypto.createHmac('sha1', process.env.GITHUB_SECRET).update(JSON.stringify(payload)).digest('hex');
    }
    // make sure the request is actually coming from github
    if (signedPayload(req.body) === req.headers['x-hub-signature']) {
      app.models.Project.findOne({ where: { repo: req.body.repository.full_name }, include: ['job','user']}, function(err, project){
        if (project && !err) {
          // log the user in and submit the job for processing
          app.models.User.login({username: "thurgood", password: process.env.THURGOOD_ADMIN_PASSWORD}, function(err, accessToken){
            if (err) {
              logger.err(err);
              res.send(err);
            } else {
              request.put(process.env.APP_URL + '/api/jobs/' + project.job().id + '/submit?access_token='+accessToken.id, function(err, results){
                if (err) {
                  logger.err(err);
                  res.send(err);
                }
                if (!err) res.send(JSON.parse(results.body));
              });
            }
          });
        } else {
          if (err) logger.error(err)
          if (!err) logger.error('Project not found with repo: ' + req.body.repository.full_name)
          res.send({success: false, message: 'Project not found with repo: ' + req.body.repository.full_name});
        }
      });
    } else {
      logger.error('Received Github webhook but incorrect secret.');
      res.send({success: false, message: 'Received Github webhook but incorrect secret.'});
    }
  })

  app.get('/test', function(req, res) {
    res.send('done');
  });

}
