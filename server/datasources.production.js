var mongodbUri = require('mongodb-uri');

console.log('--> Running production script');

// pasrse the mongodb url
var uri = mongodbUri.parse(process.env.MONGOLAB_URI);

module.exports = {
  "thurgood" : {
    "host": uri.hosts[0].host,
    "port": uri.hosts[0].port,
    "database": uri.database,
    "username": uri.username,
    "password": uri.password,
    "name": "thurgood",
    "connector": "mongodb"
  }
}
