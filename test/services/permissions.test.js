const nock = require('nock');
const PermissionsChecker = require('../../src/services/permissions-checker');
const ServiceUrlGetter = require('../../src/services/service-url-getter');

describe('services > permissions', () => {
  const urlService = new ServiceUrlGetter().perform();
  const nockObj = nock(urlService);

  describe('check permissions', () => {
    describe('with some good permissions data on rendering 1', () => {
      describe('with the "list" permission', () => {
        it('should return a resolved promise', async () => {
          expect.assertions(1);

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

          await new PermissionsChecker('envSecret', 1, 'Users', 'list').perform()
            .then(() => { expect(true).toStrictEqual(true); });
        });
      });

      describe('without the "list" permission', () => {
        it('should return a rejected promise', async () => {
          expect.assertions(1);

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

          await expect(new PermissionsChecker('envSecret', 1, 'Users', 'list').perform())
            .rejects.toThrow("'list' access forbidden on Users");
        });
      });

      describe('check if it requests permissions after a denied access', () => {
        it('should return a resolved promise', async () => {
          expect.assertions(1);

          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=1')
            .reply(200, {
              Users: {
                collection: {
                  list: true,
                },
              },
            });

          await new PermissionsChecker('envSecret', 1, 'Users', 'list').perform()
            .then(() => { expect(true).toStrictEqual(true); });
        });
      });
    });

    describe('with some good permissions data on rendering 2', () => {
      describe('with the "list" permission', () => {
        it('should return a resolved promise', async () => {
          expect.assertions(1);

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

          await new PermissionsChecker('envSecret', 2, 'Users', 'list').perform()
            .then(() => { expect(true).toStrictEqual(true); });
        });
      });
    });

    describe('with some bad permissions data', () => {
      it('should return a rejected promise', async () => {
        expect.assertions(1);

        PermissionsChecker.resetExpiration(1);
        PermissionsChecker.cleanCache();
        nock.cleanAll();
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {});

        await expect(new PermissionsChecker('envSecret', 1, 'Users', 'list').perform())
          .rejects.toThrow("'list' access forbidden on Users");
      });
    });

    describe('handling smart action permissions', () => {
      describe('if no smart action permissions are available', () => {
        it('should return a rejected promise', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {
            Users: {
              collection: {},
              actions: {},
            },
          });

          const smartActionParameters = {
            actionId: 1,
            userId: 1,
          };

          await expect(new PermissionsChecker('envSecret', 1, 'Users', 'smart action', smartActionParameters).perform())
            .rejects.toThrow("'smart action' access forbidden on Users");
        });
      });

      describe('if smart action permissions are available', () => {
        describe('if the smart action is not allowed to be executed', () => {
          it('should return a rejected promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {
              Users: {
                collection: {},
                actions: {
                  1: {
                    allowed: false,
                    users: null,
                  },
                },
              },
            });

            const smartActionParameters = {
              actionId: 1,
              userId: 1,
            };

            await expect(new PermissionsChecker('envSecret', 1, 'Users', 'smart action', smartActionParameters).perform())
              .rejects.toThrow("'smart action' access forbidden on Users");
          });
        });

        describe('if the smart action is allowed to everyone', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {
              Users: {
                collection: {},
                actions: {
                  1: {
                    allowed: true,
                    users: null,
                  },
                },
              },
            });

            const smartActionParameters = {
              actionId: 1,
              userId: 1,
            };

            const result = await new PermissionsChecker('envSecret', 1, 'Users', 'smart action', smartActionParameters).perform();
            expect(result).toBeUndefined();
          });
        });

        describe('if the smart action is restricted to some users', () => {
          it('should accept allowed users', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {
              Users: {
                collection: {},
                actions: {
                  1: {
                    allowed: true,
                    users: [1],
                  },
                },
              },
            });

            const smartActionParameters = {
              actionId: 1,
              userId: 1,
            };

            const result = await new PermissionsChecker('envSecret', 1, 'Users', 'smart action', smartActionParameters).perform();
            expect(result).toBeUndefined();
          });

          it('should refuse not allowed users', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {
              Users: {
                collection: {},
                actions: {
                  1: {
                    allowed: true,
                    users: [1],
                  },
                },
              },
            });

            const smartActionParameters = {
              actionId: 1,
              userId: 2,
            };

            await expect(new PermissionsChecker('envSecret', 1, 'Users', 'smart action', smartActionParameters).perform())
              .rejects.toThrow("'smart action' access forbidden on Users");
          });
        });

        describe('handling the user triggering the action', () => {
          it('should handle the user id as string', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, {
              Users: {
                collection: {},
                actions: {
                  1: {
                    allowed: true,
                    users: [1],
                  },
                },
              },
            });

            const smartActionParameters = {
              actionId: 1,
              userId: '1',
            };

            const result = await new PermissionsChecker('envSecret', 1, 'Users', 'smart action', smartActionParameters).perform();
            expect(result).toBeUndefined();
          });
        });
      });
    });
  });

  describe('check expiration', () => {
    function resetNock() {
      PermissionsChecker.resetExpiration(1);
      PermissionsChecker.cleanCache();
      nock.cleanAll();
    }

    describe('with permissions never retrieved', () => {
      it('should retrieve the permissions', async () => {
        expect.assertions(4);
        resetNock();
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
        resetNock();
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
        resetNock();
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
