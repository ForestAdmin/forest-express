const request = require('supertest');
const createServer = require('../helpers/create-server');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('routes > healthcheck', () => {
  describe('#GET /forest/healthcheck', () => {
    it('should return 200', async () => {
      expect.assertions(1);
      const app = createServer(envSecret, authSecret);
      await new Promise((done) => {
        request(app)
          .get('/forest/healthcheck')
          .end((error, response) => {
            expect(response.status).toStrictEqual(200);
            done();
          });
      });
    });
  });
});
