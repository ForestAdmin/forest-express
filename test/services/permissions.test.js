const PermissionsChecker = require('../../src/services/permissions-checker');
const nock = require('nock');
const ServiceUrlGetter = require('../../src/services/service-url-getter');

describe('services > permissions', () => {
  const urlService = new ServiceUrlGetter().perform();
  const nockObj = nock(urlService);

  describe('check permissions', () => {
    describe('with some good permissions data on rendering 1', () => {
      describe('with the "list" permission', () => {
        beforeAll(() => {
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

        it('should return a resolved promise', async () => {
          expect.assertions(1);
          await new PermissionsChecker('envSecret', 1, 'Users', 'list').perform()
            .then(() => { expect(true).toStrictEqual(true); });
        });
      });

      describe('without the "list" permission', () => {
        beforeAll(() => {
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

        it('should return a rejected promise', async () => {
          expect.assertions(1);
          await expect(new PermissionsChecker('envSecret', 1, 'Users', 'list').perform())
            .rejects.toThrow("'list' access forbidden on Users");
        });
      });

      describe('check if it requests permissions after a denied access', () => {
        beforeAll(() => {
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

        it('should return a resolved promise', async () => {
          expect.assertions(1);
          await new PermissionsChecker('envSecret', 1, 'Users', 'list').perform()
            .then(() => { expect(true).toStrictEqual(true); });
        });
      });
    });

    describe('with some good permissions data on rendering 2', () => {
      describe('with the "list" permission', () => {
        beforeAll(() => {
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

        it('should return a resolved promise', async () => {
          expect.assertions(1);
          await new PermissionsChecker('envSecret', 2, 'Users', 'list').perform()
            .then(() => { expect(true).toStrictEqual(true); });
        });
      });
    });

    describe('with some bad permissions data', () => {
      beforeAll(() => {
        PermissionsChecker.resetExpiration(1);
        PermissionsChecker.cleanCache();
        nock.cleanAll();
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {});
      });

      it('should return a rejected promise', async () => {
        expect.assertions(1);
        await expect(new PermissionsChecker('envSecret', 1, 'Users', 'list').perform())
          .rejects.toThrow("'list' access forbidden on Users");
      });
    });
  });

  describe('check expiration', () => {
    beforeEach(() => {
      PermissionsChecker.resetExpiration(1);
      PermissionsChecker.cleanCache();
      nock.cleanAll();
    });

    describe('with permissions never retrieved', () => {
      it('should retrieve the permissions', async () => {
        expect.assertions(4);
        let lastRetrieve = PermissionsChecker.getLastRetrieveTime(1);
        let retrievedPermissions = PermissionsChecker.getPermissions(1);

        expect(lastRetrieve).toBeNull();
        expect(retrievedPermissions).toBeNull();

        const permissions = {
          Users: {
            collection: {
              list: true,
            },
          },
        };

        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions);

        await new PermissionsChecker('envSecret', 1, 'Users', 'list')
          .perform()
          .then(() => {
            retrievedPermissions = PermissionsChecker.getPermissions(1);
            lastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

            expect(lastRetrieve).not.toBeNull();
            expect(retrievedPermissions).toStrictEqual(permissions);
          });
      });
    });

    describe('with permissions expired', () => {
      it('should re-retrieve the permissions', async () => {
        expect.assertions(6);
        process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS = 1;

        const intialLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);
        const initialRetrievedPermissions = PermissionsChecker.getPermissions(1);

        expect(intialLastRetrieve).toBeNull();
        expect(initialRetrievedPermissions).toBeNull();

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

        await new PermissionsChecker('envSecret', 1, 'Users', 'list').perform();

        const firstRetrievedPermissions = PermissionsChecker.getPermissions(1);
        const firstLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

        expect(firstRetrievedPermissions).toStrictEqual(permissions1);
        expect(firstLastRetrieve).not.toBeNull();

        await new Promise((resolve) => { setTimeout(() => resolve(), 1200); });
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions2);

        await new PermissionsChecker('envSecret', 1, 'Users', 'list')
          .perform()
          .then(() => {
            const secondRetrievedPermissions = PermissionsChecker.getPermissions(1);
            const secondLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

            expect(secondRetrievedPermissions).toStrictEqual(permissions2);
            expect(secondLastRetrieve - firstLastRetrieve > 0).toStrictEqual(true);
          });
      });
    });

    describe('with permissions not expired', () => {
      it('should not re-retrieve the permissions', async () => {
        expect.assertions(6);
        process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS = 1000;

        const intialLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);
        const initialRetrievedPermissions = PermissionsChecker.getPermissions(1);

        expect(intialLastRetrieve).toBeNull();
        expect(initialRetrievedPermissions).toBeNull();

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

        await new PermissionsChecker('envSecret', 1, 'Users', 'list').perform();

        const firstRetrievedPermissions = PermissionsChecker.getPermissions(1);
        const firstLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

        expect(firstRetrievedPermissions).toStrictEqual(permissions1);
        expect(firstLastRetrieve).not.toBeNull();

        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions2);

        new PermissionsChecker('envSecret', 1, 'Users', 'list').perform();
        const secondRetrievedPermissions = PermissionsChecker.getPermissions(1);
        const secondLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

        expect(secondRetrievedPermissions).toStrictEqual(permissions1);
        expect(secondLastRetrieve.valueOf()).toStrictEqual(firstLastRetrieve.valueOf());
      });
    });
  });
});
