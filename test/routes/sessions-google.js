const chai = require('chai');
const chaiSubset = require('chai-subset');
const forestExpress = require('../..');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const P = require('bluebird');
const request = require('../helpers/request');

const { expect } = chai;
chai.use(chaiSubset);

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

function createServer(dependencies) {
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
}

describe('API > Google OAuth2 Login', () => {
  let app;
  let googleServiceData;

  before(() => {
    const dependencies = {
      GoogleAuthorizationFinder: function (renderingId, forestToken, envSecret) {
        googleServiceData = { renderingId, forestToken, envSecret };

        this.perform = function perform() {
          return P.resolve({
            id: 'id',
            email: 'user@email.com',
            first_name: 'FirstName',
            last_name: 'LastName',
            teams: [],
          });
        };
      },

      ApimapSender: function () {
        this.perform = function () {};
      }
    };

    app = createServer(dependencies);
  });

  describe('POST /forest/sessions-google', () => {
    it('should return a valid jwt token', (done) => {
      request(app)
        .post('/forest/sessions-google')
        .send({ renderingId: 1, forestToken: 'google-access-token' })
        .expect(200)
        .end((error, response) => {
          expect(error).to.be.null;

          expect(googleServiceData).to.containSubset({
            renderingId: 1,
            forestToken: 'google-access-token',
            envSecret,
          });

          const { token } = response.body;
          const decodedJWT = jsonwebtoken.verify(token, authSecret);

          expect(decodedJWT).to.containSubset({
            id: 'id',
            type: 'users',
            data: {
              email: 'user@email.com',
              first_name: 'FirstName',
              last_name: 'LastName',
              teams: [] ,
            },
            relationships: {
              renderings: { data: [] },
            },
          });

          done();
        });
    });
  });
});
