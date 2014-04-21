var amqp = require('amqplib');
var when = require('when');

exports.task = {
  name: "connectToRabbitMQ",
  description: "Connects to RabbitMQ and adds connection to API object.",
  scope: "any",
  frequency: 0,
  toAnnounce: true,
  run: function(api, params, next){
    // console.log("[DEBUG] Connecting to RabbitMQ...")
    // var implOpts = {
    //   reconnect: true,
    //   reconnectBackoffStrategy: 'linear', // or 'exponential'
    //   reconnectBackoffTime: 500, // ms
    //   durable: false
    // };

    // var conn = amqp.createConnection({ url: api.configData.rabbitmq.url }, implOpts);

    // conn.on('ready', function(){
    //   api.configData.rabbitmq.connection = conn;
    //   console.log("[DEBUG] Successfully connected to RabbitMQ!!");
    // });    

    // conn.on('error', function(err){
    //   console.log("[FATAL] RabbitMQ error: " + err);
    // });         

  // amqp.connect(api.configData.rabbitmq.url ).then(function(conn) {
  //   return when(conn.createChannel().then(function(ch) {
  //     api.configData.rabbitmq.connection = conn;
  //     var msg = 'Hello World!';
  //     var ok = ch.assertQueue(api.configData.rabbitmq.queue, implOpts);
      
  //     return ok.then(function(_qok) {
  //       ch.sendToQueue(api.configData.rabbitmq.queue, new Buffer(msg));
  //       console.log(" [x] Sent '%s'", msg);
  //       return ch.close();
  //     });

  //   })).ensure(function() { conn.close(); });;
  // }).then(null, console.warn);
      

  }
};
