const forestExpress = require('../..');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');

module.exports = function createServer(envSecret, authSecret, dependencies) {
  const app = express();

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

  app.use(forestExpress.init(implementation, dependencies));

  return app;
};
