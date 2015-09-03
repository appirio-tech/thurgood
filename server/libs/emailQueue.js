var appRoot = require('app-root-path');
var logger = require('strong-logger');
var app = require(appRoot + '/server/server.js');
var sendgrid  = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var url = require('url');
var kue = require('kue');

if (process.env.REDIS_URL) {
  var redisURL = url.parse(process.env.REDIS_URL);
  var queue = kue.createQueue({
    prefix: 'q',
    redis: {
      port: redisURL.port,
      host: redisURL.hostname,
      auth: redisURL.auth.split(":")[1]
    }
  });
} else {
  var queue = kue.createQueue();
}

/*
* Watch for any errors in the queue
*/
queue.on( 'error', function( err ) {
  logger.error('The queue threw an error: ' + err);
});

/*
* Send email to job owner
*/
exports.sendMail = function(jobId, subject, text){
 var job = queue.create('sendMail', {
   jobId: jobId,
   subject: subject,
   text: text,
   title: jobId
 });

 job
   .on('enqueue', function (){
     logger.info('[queue] email job has been added to the queue.');
   })
   .on('complete', function (){
     logger.info('[queue] email job exited the queue successfully.');
   })
   .on('failed', function (err){
     logger.info('[queue] email job failed in the queue with the following error: ' + err);
   })
 job.save();
}

queue.process('sendMail', function (job, done){
  app.models.Job.findById(job.data.jobId, {include: ['user']}, function(err, rec){
    if (!err && rec) {
      var jobId = job.data.jobId;
      try {
        if (process.env.NODE_ENV === 'production' && rec.notification === 'email') {
          logger.info('[job-'+jobId+'] sending job email to ' + rec.user().email);
          sendgrid.send({
            to:       rec.user().email,
            from:     'Thurgood',
            subject:  job.data.subject,
            text:     job.data.text
          }, function(err, json) {
            if (!err) {
              logger.info('[job-'+jobId+'] email sent to ' + rec.user().email + ' with subject: ' + job.data.subject);
              done(null, 'Email sent.');
            } else {
              logger.error('[job-'+jobId+'] error sending with sendgrid: ' + err);
              done(err);
            }
          });
        } else {
          logger.info('[job-'+jobId+'][queue] sending job email to ' + rec.user().email);
          done(null, 'Email sent.');
        }
      } catch(error) {
        done(error);
      }
    }
    if (err) done(err);
  });
});
