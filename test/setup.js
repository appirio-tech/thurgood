var configData = require('../config').configData;
var actionHeroPrototype = require('actionHero').actionHeroPrototype;

// Silence logging
configData.logger.transports = [];

module.exports = {
  testUrl: "http://localhost:" + configData.servers.web.port + "/api/1",
  configData: configData,
  init: function (callback) {
    var self = this;
    if (!self.server) {
        self.server = new actionHeroPrototype();
        self.server.start({ configChanges: configData }, function(err, api) {
            self.api = api;
            callback();
        });
    } else {
      callback();
    }
  }
};
