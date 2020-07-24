const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const forestExpress = require('../../src');

let app;

module.exports = async function createServer(envSecret, authSecret) {
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

  const forestApp = await forestExpress.init(implementation);
  app.use(forestApp);

  return app;
};