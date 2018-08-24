const chai = require('chai');
const chaiSubset = require('chai-subset');
const jsonwebtoken = require('jsonwebtoken');
const request = require('../helpers/request');
const nock = require('nock');
const ServiceUrlGetter = require('../../src/services/service-url-getter');
const UserSecretCreator = require('../../src/services/user-secret-creator');
const createServer = require('../helpers/create-server.js');
const otplib = require('otplib');

const { expect } = chai;
chai.use(chaiSubset);

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('API > Sessions', () => {
  let app;
  const urlService = new ServiceUrlGetter().perform();
  const nockObj = nock(urlService);

  before(() => {
    const dependencies = {
      ApimapSender: function () {
        this.perform = function () {};
      }
    };

    app = createServer(envSecret, authSecret, dependencies);
  });

  describe('POST /forest/sessions', () => {
    describe('with 2FA disabled', () => {
      it('should return a valid jwt', (done) => {
        nockObj.get('/liana/v2/renderings/1/authorization')
          .reply(200, {
            data: {
              type: 'users',
              id: '123',
              attributes: {
                first_name: 'user',
                last_name: 'last',
                email: 'user@email.com',
                teams: [
                  {
                    id: 3,
                    name: 'Operations',
                    renderings: [
                      {
                        id: 1,
                        environmentId: 2,
                        teamId: 3,
                        environment: {
                          id: 2,
                        },
                      },
                    ],
                  },
                ],
              },
            },
          });

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
              id: '123',
              type: 'users',
              data: {
                email: 'user@email.com',
                first_name: 'user',
                last_name: 'last',
                teams: [
                  {
                    id: 3,
                    name: 'Operations',
                    renderings: [
                      {
                        id: 1,
                        environmentId: 2,
                        teamId: 3,
                        environment: {
                          id: 2,
                        },
                      },
                    ],
                  },
                ],
              },
              relationships: {
                renderings: {
                  data: [
                    {
                      type: 'renderings',
                      id: 1,
                    },
                  ],
                },
              },
            });

            done();
          });
      });
    });

    describe('with 2FA enabled but not active', () => {
      describe('with no token and "twoFactorRegistration" "false"', () => {
        it('should return the "user secret"', (done) => {
          const twoFactorAuthenticationSecret = '00000000000000000000';
          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';

          nockObj.get('/liana/v2/renderings/1/authorization')
            .reply(200, {
              data: {
                type: 'users',
                id: '123',
                attributes: {
                  first_name: 'user',
                  last_name: 'last',
                  email: 'user@email.com',
                  teams: [
                    {
                      id: 3,
                      name: 'Operations',
                      renderings: [
                        {
                          id: 1,
                          environmentId: 2,
                          teamId: 3,
                          environment: {
                            id: 2,
                          },
                        },
                      ],
                    },
                  ],
                  two_factor_authentication_enabled: true,
                  two_factor_authentication_active: false,
                  two_factor_authentication_secret: twoFactorAuthenticationSecret,
                },
              },
            });

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

              const {
                token,
                twoFactorAuthenticationEnabled,
                userSecret,
              } = response.body;

              const expectedUserSecret =
                new UserSecretCreator(twoFactorAuthenticationSecret, process.env.FOREST_2FA_SECRET_SALT).perform();

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
          const twoFactorAuthenticationSecret = '00000000000000000000';
          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';

          nockObj.get('/liana/v2/renderings/1/authorization?two-factor-registration=true')
            .reply(200, {
              data: {
                type: 'users',
                id: '123',
                attributes: {
                  first_name: 'user',
                  last_name: 'last',
                  email: 'user@email.com',
                  teams: [
                    {
                      id: 3,
                      name: 'Operations',
                      renderings: [
                        {
                          id: 1,
                          environmentId: 2,
                          teamId: 3,
                          environment: {
                            id: 2,
                          },
                        },
                      ],
                    },
                  ],
                  two_factor_authentication_enabled: true,
                  two_factor_authentication_active: false,
                  two_factor_authentication_secret: twoFactorAuthenticationSecret,
                },
              },
            });

          nockObj.post('/liana/v2/projects/1/two-factor-registration-confirm').reply(200);

          const expectedUserSecret =
            new UserSecretCreator(twoFactorAuthenticationSecret, process.env.FOREST_2FA_SECRET_SALT).perform();

          const token = otplib.authenticator.generate(expectedUserSecret);

          request(app)
            .post('/forest/sessions')
            .send({
              renderingId: 1,
              projectId: 1,
              email: 'user@email.com',
              password: 'user-password',
              token,
              twoFactorRegistration: true,
            })
            .expect(200)
            .end((error, response) => {
              expect(error).to.be.null;

              const { token } = response.body;

              expect(token).not.to.be.undefined;
              done();
            });
        });
      });
    });

    describe('with 2FA enabled and active', () => {
      describe('with no token and "twoFactorRegistration" "false"', () => {
        it('should return the "twoFactorAuthenticationEnabled" set to "true"', (done) => {
          nockObj.get('/liana/v2/renderings/1/authorization')
            .reply(200, {
              data: {
                type: 'users',
                id: '123',
                attributes: {
                  first_name: 'user',
                  last_name: 'last',
                  email: 'user@email.com',
                  teams: [
                    {
                      id: 3,
                      name: 'Operations',
                      renderings: [
                        {
                          id: 1,
                          environmentId: 2,
                          teamId: 3,
                          environment: {
                            id: 2,
                          },
                        },
                      ],
                    },
                  ],
                  two_factor_authentication_enabled: true,
                  two_factor_authentication_active: true,
                },
              },
            });

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
          const twoFactorAuthenticationSecret = '00000000000000000000';
          process.env.FOREST_2FA_SECRET_SALT = '11111111111111111111';

          nockObj.get('/liana/v2/renderings/1/authorization')
            .reply(200, {
              data: {
                type: 'users',
                id: '123',
                attributes: {
                  first_name: 'user',
                  last_name: 'last',
                  email: 'user@email.com',
                  teams: [
                    {
                      id: 3,
                      name: 'Operations',
                      renderings: [
                        {
                          id: 1,
                          environmentId: 2,
                          teamId: 3,
                          environment: {
                            id: 2,
                          },
                        },
                      ],
                    },
                  ],
                  two_factor_authentication_enabled: true,
                  two_factor_authentication_active: true,
                  two_factor_authentication_secret: twoFactorAuthenticationSecret,
                },
              },
            });

          nockObj.post('/liana/v2/projects/1/two-factor-registration-confirm').reply(200);

          const expectedUserSecret =
            new UserSecretCreator(twoFactorAuthenticationSecret, process.env.FOREST_2FA_SECRET_SALT).perform();

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

              const { token } = response.body;

              expect(token).not.to.be.undefined;
              done();
            });
        });
      });
    });

    describe('with a FOREST_2FA_SECRET_SALT with a length different than 20', () => {
      it('should return a 401', (done) => {
        nockObj.get('/liana/v2/renderings/1/authorization')
          .reply(200, {
            data: {
              type: 'users',
              id: '123',
              attributes: {
                first_name: 'user',
                last_name: 'last',
                email: 'user@email.com',
                teams: [
                  {
                    id: 3,
                    name: 'Operations',
                    renderings: [
                      {
                        id: 1,
                        environmentId: 2,
                        teamId: 3,
                        environment: {
                          id: 2,
                        },
                      },
                    ],
                  },
                ],
                two_factor_authentication_enabled: true,
                two_factor_authentication_active: true,
              },
            },
          });

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
