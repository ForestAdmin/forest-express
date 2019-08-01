const chai = require('chai');
const chaiSubset = require('chai-subset');
const sinon = require('sinon');
const jsonwebtoken = require('jsonwebtoken');
const P = require('bluebird');
const request = require('../helpers/request');
const nock = require('nock');
const ServiceUrlGetter = require('../../src/services/service-url-getter');
const UserSecretCreator = require('../../src/services/user-secret-creator');
const createServer = require('../helpers/create-server');
const otplib = require('otplib');

const { expect } = chai;
chai.use(chaiSubset);

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');
const twoFactorAuthenticationSecret = '00000000000000000000';

describe('API > Sessions', () => {
  let app;
  let sandbox;
  const urlService = new ServiceUrlGetter().perform();
  const nockObj = nock(urlService);

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
  });

  after(() => {
    sandbox.restore();
  });

  describe('POST /forest/sessions', () => {
    describe('with 2FA disabled', () => {
      it('should return a valid jwt', (done) => {
        request(app)
          .post('/forest/sessions')
          .send({
            renderingId: 1,
            email: 'user@email.com',
            password: 'user-password',
          })
          .expect(200)
          .end((error, response) => {
            expect(error).to.be.null;

            const { token } = response.body;
            const decodedJWT = jsonwebtoken.verify(token, authSecret);

            expect(decodedJWT).to.containSubset({
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

    describe('with 2FA enabled but not active', () => {
      describe('with no token and "twoFactorRegistration" "false"', () => {
        it('should return the "user secret"', (done) => {
          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';

          request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              email: 'user2@email.com',
              password: 'user2-password',
            })
            .expect(200)
            .end((error, response) => {
              expect(error).to.be.null;

              const {
                token,
                twoFactorAuthenticationEnabled,
                userSecret,
              } = response.body;

              const expectedUserSecret = new UserSecretCreator(
                twoFactorAuthenticationSecret,
                process.env.FOREST_2FA_SECRET_SALT,
              ).perform();

              expect(token).to.be.undefined;
              expect(twoFactorAuthenticationEnabled).to.be.true;
              expect(userSecret).to.equal(expectedUserSecret);

              done();
            });
        });
      });

      describe('with no token and "twoFactorRegistration" "true"', () => {
        it('should return a 401', (done) => {
          request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              email: 'user@email.com',
              password: 'user-password',
              twoFactorRegistration: true,
            })
            .expect(401)
            .end(() => done());
        });
      });

      describe('with a token', () => {
        it('should return a jwt token', (done) => {
          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';
          nockObj.post('/liana/v2/projects/1/two-factor-registration-confirm').reply(200);

          const expectedUserSecret = new UserSecretCreator(
            twoFactorAuthenticationSecret,
            process.env.FOREST_2FA_SECRET_SALT,
          ).perform();

          const token = otplib.authenticator.generate(expectedUserSecret);

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
            .expect(200)
            .end((error, response) => {
              expect(error).to.be.null;
              expect(response.body.token).not.to.be.undefined;
              done();
            });
        });
      });
    });

    describe('with 2FA enabled and active', () => {
      describe('with no token and "twoFactorRegistration" "false"', () => {
        it('should return the "twoFactorAuthenticationEnabled" set to "true"', (done) => {
          request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              email: 'user4@email.com',
              password: 'user4-password',
            })
            .expect(200)
            .end((error, response) => {
              expect(error).to.be.null;

              const {
                token,
                twoFactorAuthenticationEnabled,
                userSecret,
              } = response.body;

              expect(token).to.be.undefined;
              expect(userSecret).to.be.undefined;
              expect(twoFactorAuthenticationEnabled).to.be.true;

              done();
            });
        });
      });

      describe('with a token', () => {
        it('should return a jwt token', (done) => {
          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';
          nockObj.post('/liana/v2/projects/1/two-factor-registration-confirm').reply(200);

          const expectedUserSecret = new UserSecretCreator(
            twoFactorAuthenticationSecret,
            process.env.FOREST_2FA_SECRET_SALT,
          ).perform();

          const token = otplib.authenticator.generate(expectedUserSecret);

          request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              projectId: 1,
              email: 'user@email.com',
              password: 'user-password',
              token,
            })
            .expect(200)
            .end((error, response) => {
              expect(error).to.be.null;
              expect(response.body.token).not.to.be.undefined;
              done();
            });
        });
      });
    });

    describe('with a FOREST_2FA_SECRET_SALT with a length different than 20', () => {
      it('should return a 401', (done) => {
        request(app)
          .post('/forest/sessions')
          .send({
            renderingId: 1,
            email: 'user@email.com',
            password: 'user-password',
          })
          .expect(401)
          .end((error) => {
            expect(error).to.be.not.null;
            done();
          });
      });
    });
  });
});
