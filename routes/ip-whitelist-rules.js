'use strict';
var path = require('../services/path');
var auth = require('../services/auth');
var ipWhitelist = require('../services/ip-whitelist');

module.exports = function (app, options) {
  function refresh(request, response) {
    response.status(204).send();
    ipWhitelist.retrieve(options.envSecret);
  }

  this.perform = function () {
    app.get(path.generate('ip-whitelist-rules/refresh', options), auth.ensureAuthenticated, refresh);
  };
};
