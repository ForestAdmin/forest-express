const sinon = require('sinon');
const jsonwebtoken = require('jsonwebtoken');
const { request } = require('../helpers/request');
const createServer = require('../helpers/create-server');
const context = require('../../src/context');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

async function setupApp() {
  const sandbox = sinon.createSandbox();
  const forestApp = await createServer(envSecret, authSecret);

  const injections = context.inject();

  sandbox.stub(injections.forestServerRequester, 'perform');

  const oidcConfig = {
    issuer: 'forest-admin',
    authorization_endpoint: 'https://app.forestadmin.com/oidc/authorization',
  };

  return {
    forestApp, sandbox, injections, oidcConfig,
  };
}

function mockOpenIdClient(sandbox) {
  const client = {
    callback: sinon.stub(),
  };

  const issuer = {
    Client: sinon.stub().returns(client),
  };

  const injections = context.inject();

  sandbox.stub(injections.openIdClient, 'Issuer').returns(issuer);
  injections.oidcConfigurationRetrieverService.clearCache();

  return { client };
}

describe('routes > authentication', () => {
  describe('#POST /forest/authentication', () => {
    it('should return a valid authentication url', async () => {
      expect.assertions(2);
      const {
        forestApp: app, sandbox, injections, oidcConfig,
      } = await setupApp();

      try {
        const test = request(app).post('/forest/authentication')
          .send({ renderingId: 42 });

        injections.forestServerRequester.perform
          .withArgs(sinon.match(/^\/oidc\//))
          .resolves(oidcConfig);

        const receivedResponse = await new Promise((resolve, reject) => {
          test
            .end((error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response);
              }
            });
        });

        const expectedId = 'forest-express-temporary-fixed-id';
        const expectedScope = 'openid email profile';
        const expectedCallback = `${test.url}/callback`;

        expect(receivedResponse.status).toBe(200);
        expect(JSON.parse(receivedResponse.text)).toStrictEqual({
          authorizationUrl: `https://app.forestadmin.com/oidc/authorization?client_id=${
            encodeURI(expectedId)
          }&scope=${
            encodeURIComponent(expectedScope)
          }&response_type=code&redirect_uri=${
            encodeURIComponent(expectedCallback)
          }&state=${encodeURIComponent(JSON.stringify({ renderingId: 42 }))}`,
        });
      } finally {
        sandbox.restore();
      }
    });
  });

  describe('#GET /forest/authentication/callback', () => {
    it('should return a new authentication token', async () => {
      expect.assertions(6);
      const {
        forestApp: app, sandbox, injections, oidcConfig,
      } = await setupApp();

      try {
        const { client } = mockOpenIdClient(sandbox);
        client.callback.resolves({
          access_token: 'THE-ACCESS-TOKEN',
        });

        const performResponse = {
          data: {
            id: 666,
            attributes: {
              first_name: 'Alice',
              last_name: 'Doe',
              email: 'alice@forestadmin.com',
              teams: [1, 2, 3],
            },
          },
        };

        injections.forestServerRequester.perform
          .withArgs(sinon.match(/^\/oidc\//))
          .resolves(oidcConfig);

        injections.forestServerRequester.perform
          .withArgs(sinon.match(/^\/liana\/v2/), sinon.match.any, sinon.match.any, sinon.match.any)
          .resolves(performResponse);

        const test = request(app).get(`/forest/authentication/callback?code=THE-CODE&state=${
          encodeURIComponent(JSON.stringify({ renderingId: 42 }))
        }`)
          .send();

        /** @type {import('superagent').Response} */
        const receivedResponse = await new Promise((resolve, reject) => {
          test
            .end((error, response) => {
              if (error) {
                reject(error);
              } else {
                resolve(response);
              }
            });
        });

        expect(receivedResponse.status).toBe(204);
        expect(receivedResponse.text).toHaveLength(0);

        /** @type {string} */
        const sessionCookie = receivedResponse.headers['set-cookie'][0];

        expect(sessionCookie).toMatch(/^forest_session_token=[^;]+; Max-Age=1209; Path=\/; Expires=[^;]+; HttpOnly; Secure; SameSite=None$/);

        const token = sessionCookie.match(/^forest_session_token=([^;]+);/)[1];
        const decoded = jsonwebtoken.verify(token, authSecret);

        expect(decoded).toMatchObject({
          id: 666,
          email: 'alice@forestadmin.com',
          renderingId: 42,
          firstName: 'Alice',
          lastName: 'Doe',
          team: 1,
        });
        expect(injections.forestServerRequester.perform.args[0]).toStrictEqual([
          '/oidc/.well-known/openid-configuration',
        ]);
        expect(injections.forestServerRequester.perform.args[1]).toStrictEqual([
          '/liana/v2/renderings/42/google-authorization',
          envSecret,
          null,
          { 'forest-token': 'THE-ACCESS-TOKEN' },
        ]);
      } finally {
        sandbox.restore();
      }
    });
  });
});
