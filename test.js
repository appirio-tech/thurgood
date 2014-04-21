var amqp = require('amqplib');
var Q = require("q");
var when = require('when');

var url = "amqp://app9629523_heroku.com:K7RZzoTUTfKSSk3RZ6tOdyjlCO-2XgLi@tiger.cloudamqp.com/app9629523_heroku.com";
var queue = "mainQueue";
var message = {
  job_id: "53332ed29905c002002d9aba",
  type: "apex"
};
message = JSON.stringify(message);

// Publish message
amqp.connect(url).then(function(conn) {
  return when(conn.createChannel().then(function(ch) {

    var implOpts = {
      durable: false
    };

    var ok = ch.assertQueue(queue, implOpts);
    return ok.then(function(_qok) {
      ch.sendToQueue(queue, new Buffer(message));
      console.log(" [x] Sent '%s'", message);
      //deferred.resolve("Job has been successfully submitted for processing. See the job's Event Viewer for details.");
      return ch.close();
    });
  })).ensure(function() { conn.close(); });;
}).then(null, console.warn);