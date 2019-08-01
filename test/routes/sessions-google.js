const chai = require('chai');
const chaiSubset = require('chai-subset');
const sinon = require('sinon');
const jsonwebtoken = require('jsonwebtoken');
const P = require('bluebird');
const request = require('../helpers/request');
const createServer = require('../helpers/create-server');

const { expect } = chai;
chai.use(chaiSubset);

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');
const googleAccessToken = 'google-access-token';

describe('API > Google OAuth2 Login', () => {
  let app;
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    // eslint-disable-next-line global-require
    const forestServerRequester = require('../../src/services/forest-server-requester');

    app = createServer(envSecret, authSecret);

    const stubPerform = sandbox.stub(forestServerRequester, 'perform');

    stubPerform.withArgs('/liana/v1/ip-whitelist-rules').returns({
      then: () => P.resolve({
        data: {
          attributes: {
            use_ip_whitelist: false,
          },
        },
      }),
    });

    stubPerform.withArgs(
      '/liana/v2/renderings/1/google-authorization',
      envSecret,
      null,
      { 'forest-token': googleAccessToken },
    ).resolves({
      data: {
        id: '654',
        type: 'users',
        attributes: {
          email: 'user@email.com',
          first_name: 'FirstName',
          last_name: 'LastName',
          teams: ['Operations'],
        },
      },
      relationships: {
        renderings: {
          data: [{
            id: 1,
            type: 'renderings',
          }],
        },
      },
    });
  });

  after(() => {
    sandbox.restore();
  });

  describe('POST /forest/sessions-google', () => {
    it('should return a valid jwt token', (done) => {
      request(app)
        .post('/forest/sessions-google')
        .send({ renderingId: 1, forestToken: googleAccessToken })
        .expect(200)
        .end((error, response) => {
          expect(error).to.be.null;

          const { token } = response.body;
          const decodedJWT = jsonwebtoken.verify(token, authSecret);

          expect(decodedJWT).to.containSubset({
            id: '654',
            email: 'user@email.com',
            firstName: 'FirstName',
            lastName: 'LastName',
            renderingId: 1,
            team: 'Operations',
          });

          done();
        });
    });
  });
});
