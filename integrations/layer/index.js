'use strict';
var logger = require('../../services/logger');
var Routes = require('./routes');
var Setup = require('./setup');

function Checker(opts) {
  var integrationValid = false;

  function hasLayerIntegration() {
    return opts.integrations && opts.integrations.layer;
  }

  function isLayerProperlyIntegrated() {
    return opts.integrations.layer.identityEndpoint &&
      opts.integrations.layer.adminEmail &&
      opts.integrations.layer.adminPassword;
  }

  if (hasLayerIntegration()) {
    if (isLayerProperlyIntegrated()) {
      integrationValid = true;
    } else {
      logger.error('Cannot setup properly your Layer integration.');
    }
  }

  this.defineRoutes = function (app, model, Implementation) {
    if (!integrationValid) { return; }

    new Routes(app, Implementation, opts).perform();
  };

  this.defineCollections = function (Implementation, collections) {
    if (!integrationValid) { return; }
    Setup.createCollections(Implementation, collections);
  };
}

module.exports = Checker;

