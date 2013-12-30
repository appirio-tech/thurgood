var amqp = require('amqp');

exports.task = {
  name: "connectToRabbitMQ",
  description: "Connects to RabbitMQ and adds connection to API object.",
  scope: "any",
  frequency: 0,
  toAnnounce: true,
  run: function(api, params, next){
    console.log("[DEBUG] Connecting to RabbitMQ...")
    var implOpts = {
      reconnect: true,
      reconnectBackoffStrategy: 'linear', // or 'exponential'
      reconnectBackoffTime: 500, // ms
    };
    var conn = amqp.createConnection({ url: api.configData.rabbitmq.url }, implOpts);

    conn.on('ready', function(){
      api.configData.rabbitmq.connection = conn;
      console.log("[DEBUG] Successfully connected to RabbitMQ!!");
    });    

    conn.on('error', function(err){
      console.log("[FATAL] RabbitMQ error: " + err);
    });        

  }
};
