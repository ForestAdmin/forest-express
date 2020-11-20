const jsonwebtoken = require('jsonwebtoken');
const otplib = require('otplib');
const { request, addForestNock } = require('../helpers/request');
const UserSecretCreator = require('../../src/services/user-secret-creator');
const createServer = require('../helpers/create-server');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');
const twoFactorAuthenticationSecret = '00000000000000000000';

async function setupApp() {
  addForestNock(
    'get',
    '/liana/v2/renderings/1/authorization',
    { email: 'user@email.com', password: 'user-password' },
  )
    .reply(200, {
      data: {
        id: '125',
        type: 'users',
        attributes: {
          email: 'user@email.com',
          first_name: 'user',
          last_name: 'last',
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

  addForestNock(
    'get',
    '/liana/v2/renderings/1/authorization',
    { email: 'user2@email.com', password: 'user2-password' },
  )
    .reply(200, {
      data: {
        id: '126',
        type: 'users',
        attributes: {
          email: 'user2@email.com',
          first_name: 'user2',
          last_name: 'last',
          teams: ['Operations'],
          two_factor_authentication_enabled: true,
          two_factor_authentication_active: false,
          two_factor_authentication_secret: twoFactorAuthenticationSecret,
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

  addForestNock(
    'get',
    '/liana/v2/renderings/1/authorization?two-factor-registration=true',
    { email: 'user3@email.com', password: 'user3-password' },
  )
    .reply(200, {
      data: {
        id: '127',
        type: 'users',
        attributes: {
          email: 'user@email.com',
          first_name: 'user3',
          last_name: 'last',
          teams: ['Operations'],
          two_factor_authentication_enabled: true,
          two_factor_authentication_active: false,
          two_factor_authentication_secret: twoFactorAuthenticationSecret,
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

  addForestNock(
    'get',
    '/liana/v2/renderings/1/authorization',
    { email: 'user4@email.com', password: 'user4-password' },
  )
    .reply(200, {
      data: {
        id: '128',
        type: 'users',
        attributes: {
          email: 'user4@email.com',
          first_name: 'user4',
          last_name: 'last',
          teams: ['Operations'],
          two_factor_authentication_enabled: true,
          two_factor_authentication_active: true,
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

  return createServer(envSecret, authSecret);
}

describe('routes > sessions', () => {
  describe('#POST /forest/sessions', () => {
    describe('with 2FA disabled', () => {
      it('should return a valid jwt', async () => {
        expect.assertions(2);
        const app = await setupApp();
        const response = await request(app)
          .post('/forest/sessions')
          .send({
            renderingId: 1,
            email: 'user@email.com',
            password: 'user-password',
          });

        expect(response.status).toStrictEqual(200);

        const { token } = response.body;
        const decodedJWT = jsonwebtoken.verify(token, authSecret);

        expect(decodedJWT).toMatchObject({
          id: '125',
          email: 'user@email.com',
          firstName: 'user',
          lastName: 'last',
          team: 'Operations',
          renderingId: 1,
        });
      });
    });

    describe('with 2FA enabled but not active', () => {
      describe('with no token and "twoFactorRegistration" "false"', () => {
        it('should return the "user secret"', async () => {
          expect.assertions(4);
          const app = await setupApp();
          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';

          const response = await request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              email: 'user2@email.com',
              password: 'user2-password',
            });
          expect(response.status).toStrictEqual(200);

          const {
            token,
            twoFactorAuthenticationEnabled,
            userSecret,
          } = response.body;

          const expectedUserSecret = new UserSecretCreator(
            twoFactorAuthenticationSecret,
            process.env.FOREST_2FA_SECRET_SALT,
          ).perform();

          expect(token).toBeUndefined();
          expect(twoFactorAuthenticationEnabled).toStrictEqual(true);
          expect(userSecret).toStrictEqual(expectedUserSecret);
        });
      });

      describe('with no token and "twoFactorRegistration" "true"', () => {
        it('should return a 401', async () => {
          expect.assertions(1);
          const app = await setupApp();
          const response = await request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              email: 'user@email.com',
              password: 'user-password',
              twoFactorRegistration: true,
            });
          expect(response.status).toStrictEqual(401);
        });
      });

      describe('with a token', () => {
        it('should return a jwt token', async () => {
          expect.assertions(2);
          const app = await setupApp();

          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';
          addForestNock('post', '/liana/v2/projects/1/two-factor-registration-confirm').reply(200);

          const expectedUserSecret = new UserSecretCreator(
            twoFactorAuthenticationSecret,
            process.env.FOREST_2FA_SECRET_SALT,
          ).perform();

          const token = otplib.authenticator.generate(expectedUserSecret);

          const response = await request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              projectId: 1,
              email: 'user3@email.com',
              password: 'user3-password',
              token,
              twoFactorRegistration: true,
            });
          expect(response.status).toStrictEqual(200);
          expect(response.body.token).not.toBeUndefined();
        });
      });
    });

    describe('with 2FA enabled and active', () => {
      describe('with no token and "twoFactorRegistration" "false"', () => {
        it('should return the "twoFactorAuthenticationEnabled" set to "true"', async () => {
          expect.assertions(4);
          const app = await setupApp();

          const response = await request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              email: 'user4@email.com',
              password: 'user4-password',
            });
          expect(response.status).toStrictEqual(200);

          const {
            token,
            twoFactorAuthenticationEnabled,
            userSecret,
          } = response.body;

          expect(token).toBeUndefined();
          expect(userSecret).toBeUndefined();
          expect(twoFactorAuthenticationEnabled).toStrictEqual(true);
        });
      });

      describe('with a token', () => {
        it('should return a jwt token', async () => {
          expect.assertions(2);
          const app = await setupApp();

          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';
          addForestNock('post', '/liana/v2/projects/1/two-factor-registration-confirm').reply(200);

          const expectedUserSecret = new UserSecretCreator(
            twoFactorAuthenticationSecret,
            process.env.FOREST_2FA_SECRET_SALT,
          ).perform();

          const token = otplib.authenticator.generate(expectedUserSecret);

          const response = await request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              projectId: 1,
              email: 'user@email.com',
              password: 'user-password',
              token,
            });
          expect(response.status).toStrictEqual(200);
          expect(response.body.token).not.toBeUndefined();
        });
      });
    });

    describe('with a FOREST_2FA_SECRET_SALT with a length different than 20', () => {
      it('should return a 401', async () => {
        expect.assertions(1);
        process.env.FOREST_2FA_SECRET_SALT = '00';
        const app = await setupApp();

        const response = await request(app)
          .post('/forest/sessions')
          .send({
            renderingId: 1,
            email: 'user2@email.com',
            password: 'user2-password',
          });
        expect(response.status).toStrictEqual(401);
      });
    });
  });
});
