const express = require('express');
const bodyParser = require('body-parser');
const { expressjwt: jwt } = require('express-jwt');
const { inject } = require('@forestadmin/context');

const forestExpress = require('../../src');
const { getJWTConfiguration } = require('../../src/config/jwt');
const request = require('./request');

let app;

module.exports = async function createServer(envSecret, authSecret) {
  if (app) {
    return app;
  }

  app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(jwt(getJWTConfiguration({ secret: 'jwt-secret' })));

  const implementation = {
    opts: {
      envSecret,
      authSecret,
      connections: {
        db1: {
          models: {},
        },
      },
    },
  };

  implementation.getModelName = () => {};
  implementation.getLianaName = () => {};
  implementation.getLianaVersion = () => {};
  implementation.getOrmVersion = () => {};
  implementation.getDatabaseType = () => {};

  // We don't want to subscribe Server Events in tests
  jest.spyOn(inject().forestAdminClient, 'subscribeToServerEvents').mockResolvedValue();

  const forestApp = await forestExpress.init(implementation);
  app.use(forestApp);
  request.init();

  return app;
};
