const sinon = require('sinon');
const { request } = require('../helpers/request');
const createServer = require('../helpers/create-server');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

let stubPerform;

async function setupApp() {
  const sandbox = sinon.createSandbox();
  // eslint-disable-next-line global-require
  const forestServerRequester = require('../../src/services/forest-server-requester');
  const forestApp = await createServer(envSecret, authSecret);

  if (!stubPerform) {
    stubPerform = sandbox.stub(forestServerRequester, 'perform');
  }

  return forestApp;
}

describe('routes > authentication', () => {
  describe('#POST /forest/authentication', () => {
    it('should return a valid authentication url', async () => {
      expect.assertions(2);
      const app = await setupApp();

      const test = request(app).post('/forest/authentication')
        .send();

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
        }`,
      });
    });
  });
});
