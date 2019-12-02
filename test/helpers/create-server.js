const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const forestExpress = require('../../src');

let app;

module.exports = function createServer(envSecret, authSecret) {
  if (app) {
    return app;
  }

  app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(jwt({
    secret: 'jwt-secret',
    credentialsRequired: false,
  }));

  const implementation = {
    opts: {
      envSecret,
      authSecret,
    },
  };

  implementation.getModels = () => {};
  implementation.getLianaName = () => {};
  implementation.getLianaVersion = () => {};
  implementation.getOrmVersion = () => {};
  implementation.getDatabaseType = () => {};

  return forestExpress.init(implementation)
    .then((forestApp) => app.use(forestApp))
    .then(() => app);
};
