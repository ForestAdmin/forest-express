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
    registration_endpoint: 'https://app.forestadmin.com/oidc/registration',
  };

  return {
    forestApp, sandbox, injections, oidcConfig,
  };
}

function mockOpenIdClient(sandbox) {
  const client = {
    callback: sinon.stub(),
    authorizationUrl: sinon.stub(),
  };

  const issuer = {
    Client: sinon.stub().returns(client),
  };

  issuer.Client.register = sinon.stub().resolves(client);

  const injections = context.inject();
  injections.oidcClientManagerService.clearCache();

  sandbox.stub(injections.openIdClient, 'Issuer').returns(issuer);
  injections.oidcConfigurationRetrieverService.clearCache();

  return { client, issuer };
}

describe('routes > authentication', () => {
  describe('#POST /forest/authentication', () => {
    /**
     * @param {import('superagent').SuperAgentRequest} testedRequest
     * @param {*} body
     * @param {{
     *  sandbox: import('sinon').SinonSandbox;
     *  injections: any;
     *  oidcConfig: any;
     * }} param2
     * @returns {Promise<import('superagent').Response>}
     */
    async function setupTest(testedRequest, body, { sandbox, injections, oidcConfig }) {
      const { client } = mockOpenIdClient(sandbox);

      client.authorizationUrl.returns('https://authorization');

      injections.forestServerRequester.perform
        .withArgs(sinon.match(/^\/oidc\//))
        .resolves(oidcConfig);

      return new Promise((resolve, reject) => {
        testedRequest
          .send(body)
          .end((error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          });
      });
    }
    it('should return a valid authentication url', async () => {
      expect.assertions(2);
      const {
        forestApp: app, sandbox, injections, oidcConfig,
      } = await setupApp();

      try {
        const test = request(app).post('/forest/authentication');

        const receivedResponse = await setupTest(test, { renderingId: 42 }, {
          sandbox, injections, oidcConfig,
        });

        expect(receivedResponse.status).toBe(200);
        expect(receivedResponse.body.authorizationUrl).toStrictEqual('https://authorization');
      } finally {
        sandbox.restore();
      }
    });

    it('should return a valid authentication url even with an invalid token in the query', async () => {
      expect.assertions(1);
      const {
        forestApp: app, sandbox, injections, oidcConfig,
      } = await setupApp();

      try {
        const test = request(app).post('/forest/authentication')
          .set('Cookie', 'forest_session_token=INVALID_TOKEN');

        const receivedResponse = await setupTest(test, { renderingId: 42 }, {
          sandbox, injections, oidcConfig,
        });

        expect(receivedResponse.status).toBe(200);
      } finally {
        sandbox.restore();
      }
    });
  });

  describe('#GET /forest/authentication/callback', () => {
    /**
     * @param {import('superagent').SuperAgentRequest} testedRequest
     * @param {{
     *  sandbox: import('sinon').SinonSandbox;
     *  injections: any;
     *  oidcConfig: any;
     * }} mocks
     * @returns {{
     *  receivedResponse: Promise<import('superagent').Response>;
     *  issuer: any;
     * }}
     */
    async function setupTest(testedRequest, {
      sandbox, injections, oidcConfig,
    }) {
      const { client, issuer } = mockOpenIdClient(sandbox);
      client.callback.resolves({
        access_token: 'THE-ACCESS-TOKEN',
      });
      issuer.Client.register.resolves(client);

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

      const receivedResponse = await new Promise((resolve, reject) => {
        testedRequest
          .send()
          .end((error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          });
      });

      return { receivedResponse, issuer };
    }
    it('should return a new authentication token', async () => {
      expect.assertions(7);
      const {
        forestApp: app, sandbox, injections, oidcConfig,
      } = await setupApp();

      try {
        const test = request(app).get(`/forest/authentication/callback?code=THE-CODE&state=${
          encodeURIComponent(JSON.stringify({ renderingId: 42 }))
        }`);

        const { receivedResponse, issuer } = await setupTest(test, {
          sandbox, oidcConfig, injections, app,
        });

        expect(receivedResponse.status).toBe(200);
        expect(receivedResponse.text).not.toHaveLength(0);

        const { token } = (await receivedResponse).body;
        const decoded = jsonwebtoken.verify(token, authSecret);

        const expectedTokenData = {
          id: 666,
          email: 'alice@forestadmin.com',
          renderingId: 42,
          firstName: 'Alice',
          lastName: 'Doe',
          team: 1,
        };

        expect(decoded).toMatchObject(expectedTokenData);
        expect(JSON.parse(receivedResponse.text)).toStrictEqual({ token, tokenData: decoded });

        expect(injections.forestServerRequester.perform.args[0]).toStrictEqual([
          '/oidc/.well-known/openid-configuration',
        ]);
        expect(injections.forestServerRequester.perform.args[1]).toStrictEqual([
          '/liana/v2/renderings/42/authorization',
          envSecret,
          null,
          { 'forest-token': 'THE-ACCESS-TOKEN' },
        ]);
        expect(issuer.Client.register.firstCall.args).toStrictEqual([{
          client_id: undefined,
          redirect_uris: [
            'http://localhost:3310/forest/authentication/callback',
          ],
          token_endpoint_auth_method: 'none',
        }, {
          initialAccessToken: envSecret,
        }]);
      } finally {
        sandbox.restore();
      }
    });

    it('should return a new authentication token even if the previously received token is invalid', async () => {
      expect.assertions(1);
      const {
        forestApp: app, sandbox, injections, oidcConfig,
      } = await setupApp();

      try {
        const test = request(app).get(`/forest/authentication/callback?code=THE-CODE&state=${
          encodeURIComponent(JSON.stringify({ renderingId: 42 }))
        }`)
          .set('Cookie', 'forest_session_token=INVALID');

        const { receivedResponse } = await setupTest(test, {
          sandbox, oidcConfig, injections, app,
        });

        expect(receivedResponse.status).toBe(200);
      } finally {
        sandbox.restore();
      }
    });
  });

  describe('#POST /forest/authentication/logout', () => {
    it('should return 204', async () => {
      expect.assertions(1);

      const {
        forestApp: app, sandbox,
      } = await setupApp();

      try {
        const response = await request(app).post('/forest/authentication/logout').send();

        expect(response.status).toStrictEqual(204);
      } finally {
        sandbox.restore();
      }
    });
  });
});
