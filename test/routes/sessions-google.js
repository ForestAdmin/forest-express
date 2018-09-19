const chai = require('chai');
const chaiSubset = require('chai-subset');
const jsonwebtoken = require('jsonwebtoken');
const P = require('bluebird');
const request = require('../helpers/request');
const createServer = require('../helpers/create-server');

const { expect } = chai;
chai.use(chaiSubset);

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('API > Google OAuth2 Login', () => {
  let app;
  let googleServiceData;

  before(() => {
    const dependencies = {
      AuthorizationFinder: function (renderingId, envSecret, twoFactorRegistration, email, password, forestToken) {
        googleServiceData = { renderingId, envSecret, twoFactorRegistration, email, password, forestToken };

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

    app = createServer(envSecret, authSecret, dependencies);
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
            envSecret,
            forestToken: 'google-access-token',
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
