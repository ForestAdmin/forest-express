const jsonwebtoken = require('jsonwebtoken');
const { request, addForestNock } = require('../helpers/request');
const createServer = require('../helpers/create-server');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');
const googleAccessToken = 'google-access-token';

describe('routes > session Google', () => {
  describe('#POST /forest/sessions-google', () => {
    const init = () => {
      addForestNock('get', '/liana/v2/renderings/1/google-authorization')
        .reply(200, {
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
    };

    it('should return a valid jwt token', async () => {
      expect.assertions(1);
      init();
      const app = await createServer(envSecret, authSecret);
      const response = await request(app)
        .post('/forest/sessions-google')
        .send({ renderingId: 1, forestToken: googleAccessToken })
        .expect(200);

      const { token } = response.body;
      const decodedJWT = jsonwebtoken.verify(token, authSecret);

      expect(decodedJWT).toMatchObject({
        id: '654',
        email: 'user@email.com',
        firstName: 'FirstName',
        lastName: 'LastName',
        renderingId: 1,
        team: 'Operations',
      });
    });
  });
});
