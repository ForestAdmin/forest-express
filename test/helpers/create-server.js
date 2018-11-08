const forestExpress = require('../../src');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');

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

  app.use(forestExpress.init(implementation));

  return app;
};
