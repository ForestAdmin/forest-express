const chai = require('chai');
const PermissionsChecker= require('../../src/services/permissions-checker');
const nock = require('nock');
const ServiceUrlGetter = require('../../src/services/service-url-getter');

const { expect } = chai;

describe('Service > Permissions', () => {
  const urlService = new ServiceUrlGetter().perform();
  const nockObj = nock(urlService);

  describe('Check permissions', () => {
    describe('with some good permissions data', () => {
      describe('with the "list" permission', () => {
        before(() => {
          PermissionsChecker.resetExpiration();
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v1/permissions')
            .reply(200, {
              Users: {
                permissions: {
                  list: true,
                },
              },
            });
        });

        it('should return a resolved promise', (done) => {
          new PermissionsChecker('envSecret', 'Users', 'list')
            .perform()
            .then(done)
            .catch(done);
        });
      });

      describe('without the "list" permission', () => {
        before(() => {
          PermissionsChecker.resetExpiration();
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v1/permissions')
            .reply(200, {
              Users: {
                permissions: {
                  list: false,
                },
              },
            });
        });

        it('should return a rejected promise', (done) => {
          new PermissionsChecker('envSecret', 'Users', 'list')
            .perform()
            .then(() => done(new Error('fail')))
            .catch(() => done());
        });
      });
    });

    describe('with some bad permissions data', () => {
      before(() => {
        PermissionsChecker.resetExpiration();
        PermissionsChecker.cleanCache();
        nock.cleanAll();
        nockObj.get('/liana/v1/permissions').reply(200, {});
      });

      it('should return a rejected promise', (done) => {
        new PermissionsChecker('envSecret', 'Users', 'list')
          .perform()
          .then(() => done(new Error('fail')))
          .catch(() => done());
      });
    });
  });

  describe('Check expiration', () => {
    beforeEach(() => {
      PermissionsChecker.resetExpiration();
      PermissionsChecker.cleanCache();
      nock.cleanAll();
    });

    describe('with permissions never retrieved', () => {
      it('should retrieve the permissions', (done) => {
        let lastRetrieve = PermissionsChecker.getLastRetrieveTime();
        let retrievedPermissions = PermissionsChecker.getPermissions();

        expect(lastRetrieve).to.be.null;
        expect(retrievedPermissions).to.be.null;

        const permissions = {
          Users: {
            permissions: {
              list: true,
            },
          },
        };

        nockObj.get('/liana/v1/permissions').reply(200, permissions);

        new PermissionsChecker('envSecret', 'Users', 'list')
          .perform()
          .then(() => {
            retrievedPermissions = PermissionsChecker.getPermissions();
            lastRetrieve = PermissionsChecker.getLastRetrieveTime();

            expect(lastRetrieve).to.not.be.null;
            expect(retrievedPermissions).to.deep.equal(permissions);

            done();
          })
          .catch(done);
      });
    });

    describe('with permissions expired', () => {
      it('should re-retrieve the permissions', (done) => {
        process.env.PERMISSIONS_EXPIRATION_IN_SECONDS = 1;

        const intialLastRetrieve = PermissionsChecker.getLastRetrieveTime();
        const initialRetrievedPermissions = PermissionsChecker.getPermissions();

        expect(intialLastRetrieve).to.be.null;
        expect(initialRetrievedPermissions).to.be.null;

        const permissions1 = {
          Users: {
            permissions: {
              list: true,
            },
          },
        };

        const permissions2 = {
          Users: {
            permissions: {
              list: true,
            },
          },
          Posts: {
            permissions: {
              list: false,
            }
          }
        };

        nockObj.get('/liana/v1/permissions').reply(200, permissions1);

        new PermissionsChecker('envSecret', 'Users', 'list')
          .perform()
          .then(() => {
            const firestRetrievedPermissions = PermissionsChecker.getPermissions();
            const firstLastRetrieve = PermissionsChecker.getLastRetrieveTime();

            expect(firestRetrievedPermissions).to.deep.equal(permissions1);
            expect(firstLastRetrieve).to.be.not.null;

            setTimeout(() => {
              nockObj.get('/liana/v1/permissions').reply(200, permissions2);

              new PermissionsChecker('envSecret', 'Users', 'list')
                .perform()
                .then(() => {
                  const secondRetrievedPermissions = PermissionsChecker.getPermissions();
                  const secondLastRetrieve = PermissionsChecker.getLastRetrieveTime();

                  expect(secondRetrievedPermissions).to.deep.equal(permissions2);
                  expect(secondLastRetrieve.valueOf() - firstLastRetrieve.valueOf() > 0).to.be.true;

                  done();
                })
                .catch(done);
            }, 1200);
          })
          .catch(done);
      });
    });

    describe('with permissions not expired', () => {
      it('should not re-retrieve the permissions', (done) => {
        process.env.PERMISSIONS_EXPIRATION_IN_SECONDS = 1000;

        const intialLastRetrieve = PermissionsChecker.getLastRetrieveTime();
        const initialRetrievedPermissions = PermissionsChecker.getPermissions();

        expect(intialLastRetrieve).to.be.null;
        expect(initialRetrievedPermissions).to.be.null;

        const permissions1 = {
          Users: {
            permissions: {
              list: true,
            },
          },
        };

        const permissions2 = {
          Users: {
            permissions: {
              list: true,
            },
          },
          Posts: {
            permissions: {
              list: false,
            }
          }
        };

        nockObj.get('/liana/v1/permissions').reply(200, permissions1);

        new PermissionsChecker('envSecret', 'Users', 'list')
          .perform()
          .then(() => {
            const firestRetrievedPermissions = PermissionsChecker.getPermissions();
            const firstLastRetrieve = PermissionsChecker.getLastRetrieveTime();

            expect(firestRetrievedPermissions).to.deep.equal(permissions1);
            expect(firstLastRetrieve).to.be.not.null;

            nockObj.get('/liana/v1/permissions').reply(200, permissions2);

            new PermissionsChecker('envSecret', 'Users', 'list')
              .perform()
              .then(() => {
                const secondRetrievedPermissions = PermissionsChecker.getPermissions();
                const secondLastRetrieve = PermissionsChecker.getLastRetrieveTime();

                expect(secondRetrievedPermissions).to.deep.equal(permissions1);
                expect(secondLastRetrieve.valueOf()).to.be.equal(firstLastRetrieve.valueOf());

                done();
              })
              .catch(done);
          })
          .catch(done);
      });
    });
  });
});
