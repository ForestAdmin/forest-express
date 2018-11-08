const chai = require('chai');
const PermissionsChecker = require('../../src/services/permissions-checker');
const nock = require('nock');
const ServiceUrlGetter = require('../../src/services/service-url-getter');

const { expect } = chai;

describe('Service > Permissions', () => {
  const urlService = new ServiceUrlGetter().perform();
  const nockObj = nock(urlService);

  describe('Check permissions', () => {
    describe('with some good permissions data on rendering 1', () => {
      describe('with the "list" permission', () => {
        before(() => {
          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=1')
            .reply(200, {
              Users: {
                collection: {
                  list: true,
                },
              },
            });
        });

        it('should return a resolved promise', (done) => {
          new PermissionsChecker('envSecret', 1, 'Users', 'list')
            .perform()
            .then(done)
            .catch(done);
        });
      });

      describe('without the "list" permission', () => {
        before(() => {
          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=1')
            .reply(200, {
              Users: {
                collection: {
                  list: false,
                },
              },
            });
        });

        it('should return a rejected promise', (done) => {
          new PermissionsChecker('envSecret', 1, 'Users', 'list')
            .perform()
            .then(() => done(new Error('fail')))
            .catch(() => done());
        });
      });

      describe('check if it requests permissions after a denied access', () => {
        before(() => {
          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=1')
            .reply(200, {
              Users: {
                collection: {
                  list: true,
                },
              },
            });
        });

        it('should return a resolved promise', (done) => {
          new PermissionsChecker('envSecret', 1, 'Users', 'list')
            .perform()
            .then(done)
            .catch(done);
        });
      });
    });

    describe('with some good permissions data on rendering 2', () => {
      describe('with the "list" permission', () => {
        before(() => {
          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=2')
            .reply(200, {
              Users: {
                collection: {
                  list: true,
                },
              },
            });
        });

        it('should return a resolved promise', (done) => {
          new PermissionsChecker('envSecret', 2, 'Users', 'list')
            .perform()
            .then(done)
            .catch(done);
        });
      });
    });

    describe('with some bad permissions data', () => {
      before(() => {
        PermissionsChecker.resetExpiration(1);
        PermissionsChecker.cleanCache();
        nock.cleanAll();
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {});
      });

      it('should return a rejected promise', (done) => {
        new PermissionsChecker('envSecret', 1, 'Users', 'list')
          .perform()
          .then(() => done(new Error('fail')))
          .catch(() => done());
      });
    });
  });

  describe('Check expiration', () => {
    beforeEach(() => {
      PermissionsChecker.resetExpiration(1);
      PermissionsChecker.cleanCache();
      nock.cleanAll();
    });

    describe('with permissions never retrieved', () => {
      it('should retrieve the permissions', (done) => {
        let lastRetrieve = PermissionsChecker.getLastRetrieveTime(1);
        let retrievedPermissions = PermissionsChecker.getPermissions(1);

        expect(lastRetrieve).to.be.null;
        expect(retrievedPermissions).to.be.null;

        const permissions = {
          Users: {
            collection: {
              list: true,
            },
          },
        };

        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions);

        new PermissionsChecker('envSecret', 1, 'Users', 'list')
          .perform()
          .then(() => {
            retrievedPermissions = PermissionsChecker.getPermissions(1);
            lastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

            expect(lastRetrieve).to.not.be.null;
            expect(retrievedPermissions).to.deep.equal(permissions);

            done();
          })
          .catch(done);
      });
    });

    describe('with permissions expired', () => {
      it('should re-retrieve the permissions', (done) => {
        process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS = 1;

        const intialLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);
        const initialRetrievedPermissions = PermissionsChecker.getPermissions(1);

        expect(intialLastRetrieve).to.be.null;
        expect(initialRetrievedPermissions).to.be.null;

        const permissions1 = {
          Users: {
            collection: {
              list: true,
            },
          },
        };

        const permissions2 = {
          Users: {
            collection: {
              list: true,
            },
          },
          Posts: {
            collection: {
              list: false,
            },
          },
        };

        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions1);

        new PermissionsChecker('envSecret', 1, 'Users', 'list')
          .perform()
          .then(() => {
            const firstRetrievedPermissions = PermissionsChecker.getPermissions(1);
            const firstLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

            expect(firstRetrievedPermissions).to.deep.equal(permissions1);
            expect(firstLastRetrieve).to.be.not.null;

            setTimeout(() => {
              nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions2);

              new PermissionsChecker('envSecret', 1, 'Users', 'list')
                .perform()
                .then(() => {
                  const secondRetrievedPermissions = PermissionsChecker.getPermissions(1);
                  const secondLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

                  expect(secondRetrievedPermissions).to.deep.equal(permissions2);
                  expect(secondLastRetrieve - firstLastRetrieve > 0).to.be.true;

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
        process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS = 1000;

        const intialLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);
        const initialRetrievedPermissions = PermissionsChecker.getPermissions(1);

        expect(intialLastRetrieve).to.be.null;
        expect(initialRetrievedPermissions).to.be.null;

        const permissions1 = {
          Users: {
            collection: {
              list: true,
            },
          },
        };

        const permissions2 = {
          Users: {
            collection: {
              list: true,
            },
          },
          Posts: {
            collection: {
              list: false,
            },
          },
        };

        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions1);

        new PermissionsChecker('envSecret', 1, 'Users', 'list')
          .perform()
          .then(() => {
            const firstRetrievedPermissions = PermissionsChecker.getPermissions(1);
            const firstLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

            expect(firstRetrievedPermissions).to.deep.equal(permissions1);
            expect(firstLastRetrieve).to.be.not.null;

            nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions2);

            new PermissionsChecker('envSecret', 1, 'Users', 'list')
              .perform()
              .then(() => {
                const secondRetrievedPermissions = PermissionsChecker.getPermissions(1);
                const secondLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

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
