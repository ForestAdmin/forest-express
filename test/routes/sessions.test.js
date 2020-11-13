const sinon = require('sinon');
const jsonwebtoken = require('jsonwebtoken');
const P = require('bluebird');
const nock = require('nock');
const otplib = require('otplib');
const request = require('../helpers/request');
const forestUrlGetter = require('../../src/utils/forest-url-getter');
const UserSecretCreator = require('../../src/services/user-secret-creator');
const createServer = require('../helpers/create-server');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');
const twoFactorAuthenticationSecret = '00000000000000000000';
let stubPerform;

async function setupApp() {
  const sandbox = sinon.createSandbox();
  // eslint-disable-next-line global-require
  const forestServerRequester = require('../../src/services/forest-server-requester');
  const forestApp = await createServer(envSecret, authSecret);

  if (!stubPerform) {
    stubPerform = sandbox.stub(forestServerRequester, 'perform');

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
      '/liana/v2/renderings/1/authorization',
      envSecret,
      null,
      { email: 'user@email.com', password: 'user-password' },
    ).resolves({
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

    stubPerform.withArgs(
      '/liana/v2/renderings/1/authorization',
      envSecret,
      null,
      { email: 'user2@email.com', password: 'user2-password' },
    ).resolves({
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

    stubPerform.withArgs(
      '/liana/v2/renderings/1/authorization?two-factor-registration=true',
      envSecret,
      null,
      { email: 'user3@email.com', password: 'user3-password' },
    ).resolves({
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

    stubPerform.withArgs(
      '/liana/v2/renderings/1/authorization',
      envSecret,
      null,
      { email: 'user4@email.com', password: 'user4-password' },
    ).resolves({
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
  }

  return forestApp;
}

async function setupNock() {
  const urlService = forestUrlGetter();
  return nock(urlService);
}

describe('routes > sessions', () => {
  describe('#POST /forest/sessions', () => {
    describe('with 2FA disabled', () => {
      it('should return a valid jwt', async () => {
        expect.assertions(3);
        const app = await setupApp();
        await new Promise((done) => {
          request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              email: 'user@email.com',
              password: 'user-password',
            })
            .end((error, response) => {
              expect(response.status).toStrictEqual(200);
              expect(error).toBeNull();

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

              done();
            });
        });
      });
    });

    describe('with 2FA enabled but not active', () => {
      describe('with no token and "twoFactorRegistration" "false"', () => {
        it('should return the "user secret"', async () => {
          expect.assertions(5);
          const app = await setupApp();
          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';

          await new Promise((done) => {
            request(app)
              .post('/forest/sessions')
              .send({
                renderingId: 1,
                email: 'user2@email.com',
                password: 'user2-password',
              })
              .end((error, response) => {
                expect(response.status).toStrictEqual(200);
                expect(error).toBeNull();

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

                done();
              });
          });
        });
      });

      describe('with no token and "twoFactorRegistration" "true"', () => {
        it('should return a 401', async () => {
          expect.assertions(1);
          const app = await setupApp();
          await new Promise((done) => {
            request(app)
              .post('/forest/sessions')
              .send({
                renderingId: 1,
                email: 'user@email.com',
                password: 'user-password',
                twoFactorRegistration: true,
              })
              .end((error, response) => {
                expect(response.status).toStrictEqual(401);
                done();
              });
          });
        });
      });

      describe('with a token', () => {
        it('should return a jwt token', async () => {
          expect.assertions(3);
          const app = await setupApp();
          const nockObj = await setupNock();

          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';
          nockObj.post('/liana/v2/projects/1/two-factor-registration-confirm').reply(200);

          const expectedUserSecret = new UserSecretCreator(
            twoFactorAuthenticationSecret,
            process.env.FOREST_2FA_SECRET_SALT,
          ).perform();

          const token = otplib.authenticator.generate(expectedUserSecret);

          await new Promise((done) => {
            request(app)
              .post('/forest/sessions')
              .send({
                renderingId: 1,
                projectId: 1,
                email: 'user3@email.com',
                password: 'user3-password',
                token,
                twoFactorRegistration: true,
              })
              .end((error, response) => {
                expect(response.status).toStrictEqual(200);
                expect(error).toBeNull();
                expect(response.body.token).not.toBeUndefined();
                done();
              });
          });
        });
      });
    });

    describe('with 2FA enabled and active', () => {
      describe('with no token and "twoFactorRegistration" "false"', () => {
        it('should return the "twoFactorAuthenticationEnabled" set to "true"', async () => {
          expect.assertions(5);
          const app = await setupApp();

          await new Promise((done) => {
            request(app)
              .post('/forest/sessions')
              .send({
                renderingId: 1,
                email: 'user4@email.com',
                password: 'user4-password',
              })
              .end((error, response) => {
                expect(response.status).toStrictEqual(200);
                expect(error).toBeNull();

                const {
                  token,
                  twoFactorAuthenticationEnabled,
                  userSecret,
                } = response.body;

                expect(token).toBeUndefined();
                expect(userSecret).toBeUndefined();
                expect(twoFactorAuthenticationEnabled).toStrictEqual(true);

                done();
              });
          });
        });
      });

      describe('with a token', () => {
        it('should return a jwt token', async () => {
          expect.assertions(3);
          const app = await setupApp();
          const nockObj = await setupNock();

          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';
          nockObj.post('/liana/v2/projects/1/two-factor-registration-confirm').reply(200);

          const expectedUserSecret = new UserSecretCreator(
            twoFactorAuthenticationSecret,
            process.env.FOREST_2FA_SECRET_SALT,
          ).perform();

          const token = otplib.authenticator.generate(expectedUserSecret);

          await new Promise((done) => {
            request(app)
              .post('/forest/sessions')
              .send({
                renderingId: 1,
                projectId: 1,
                email: 'user@email.com',
                password: 'user-password',
                token,
              })
              .end((error, response) => {
                expect(response.status).toStrictEqual(200);
                expect(error).toBeNull();
                expect(response.body.token).not.toBeUndefined();
                done();
              });
          });
        });
      });
    });

    describe('with a FOREST_2FA_SECRET_SALT with a length different than 20', () => {
      it('should return a 401', async () => {
        expect.assertions(1);
        process.env.FOREST_2FA_SECRET_SALT = '00';
        const app = await setupApp();

        await new Promise((done) => {
          request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              email: 'user2@email.com',
              password: 'user2-password',
            })
            .end((error, response) => {
              expect(response.status).toStrictEqual(401);
              done();
            });
        });
      });
    });
  });
});
