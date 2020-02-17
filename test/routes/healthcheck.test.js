const request = require('supertest');
const createServer = require('../helpers/create-server');

const ACCESS_CONTROL_ALLOW_ORIGIN = 'access-control-allow-origin';
const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('routes > healthcheck', () => {
  describe('#GET /forest/healthcheck', () => {
    it('should return 200', async () => {
      expect.assertions(2);
      const app = await createServer(envSecret, authSecret);
      await new Promise((done) => {
        request(app)
          .get('/forest/healthcheck')
          .end((error, response) => {
            expect(response.status).toStrictEqual(200);
            expect(response.res.headers[ACCESS_CONTROL_ALLOW_ORIGIN]).toStrictEqual('*');
            done();
          });
      });
    });
  });
});
