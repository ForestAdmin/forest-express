const nock = require('nock');
const PermissionsChecker = require('../../src/services/permissions-checker');
const context = require('../../src/context/');
const initContext = require('../../src/context/init');

context.init(initContext);

describe('services > permissions', () => {
  const { forestUrl } = context.inject();
  const nockObj = nock(forestUrl);

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

          await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list')
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

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list'))
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

          await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list')
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

          await new PermissionsChecker('envSecret', 2).checkPermissions('Users', 'list')
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

        await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list'))
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

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'actions', smartActionParameters))
            .rejects.toThrow("'actions' access forbidden on Users");
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

            await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'actions', smartActionParameters))
              .rejects.toThrow("'actions' access forbidden on Users");
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

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'actions', smartActionParameters);
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

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'actions', smartActionParameters);
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

            await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'actions', smartActionParameters))
              .rejects.toThrow("'actions' access forbidden on Users");
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

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'actions', smartActionParameters);
            expect(result).toBeUndefined();
          });
        });
      });
    });
  });

  describe('handling user list on collection with scope', () => {
    const scopedCollectionResponse = {
      Users: {
        collection: {
          list: true,
        },
        scope: {
          filter: {
            aggregator: 'or',
            conditions: [
              {
                field: 'name',
                value: '$currentUser.firstName',
                operator: 'equal',
              },
              {
                field: 'name',
                value: '$currentUser.team.name',
                operator: 'equal',
              },
            ],
          },
          dynamicScopesValues: {
            users: {
              100: {
                '$currentUser.firstName': 'John',
                '$currentUser.team.name': 'Admin',
              },
            },
          },
        },
      },
      Posts: {
        collection: {
          list: true,
        },
        scope: {
          filter: {
            aggregator: 'and',
            conditions: [
              {
                field: 'name',
                value: 'toto',
                operator: 'equal',
              },
            ],
          },
        },
      },
    };

    describe('when the request match with the expected scope', () => {
      describe('without additional filters', () => {
        it('should return undefined', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, scopedCollectionResponse);

          const collectionListParameters = {
            userId: 100,
            filters: JSON.stringify({
              aggregator: 'or',
              conditions: [
                { field: 'name', operator: 'equal', value: 'John' },
                { field: 'name', operator: 'equal', value: 'Admin' },
              ],
            }),
          };

          const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list', collectionListParameters);
          expect(result).toBeUndefined();
        });

        it('should return undefined when scope uses a single scope', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, scopedCollectionResponse);

          const collectionListParameters = {
            userId: 100,
            filters: JSON.stringify(
              { field: 'name', operator: 'equal', value: 'toto' },
            ),
          };

          const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Posts', 'list', collectionListParameters);
          expect(result).toBeUndefined();
        });
      });

      describe('with additional filters', () => {
        it('should return undefined when sending scope and manual filters', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, scopedCollectionResponse);

          const collectionListParameters = {
            userId: 100,
            filters: JSON.stringify({
              aggregator: 'and',
              conditions: [
                { field: 'name', operator: 'equal', value: 'Arnaud' },
                {
                  aggregator: 'or',
                  conditions: [
                    { field: 'name', operator: 'equal', value: 'John' },
                    { field: 'name', operator: 'equal', value: 'Admin' },
                  ],
                },
              ],
            }),
          };

          const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list', collectionListParameters);
          expect(result).toBeUndefined();
        });
      });

      it('should return undefined when scope uses a single scope', async () => {
        expect.assertions(1);

        PermissionsChecker.resetExpiration(1);
        PermissionsChecker.cleanCache();
        nock.cleanAll();
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, scopedCollectionResponse);

        const collectionListParameters = {
          userId: 100,
          filters: JSON.stringify({
            aggregator: 'and',
            conditions: [
              { field: 'name', operator: 'equal', value: 'toto' },
              { field: 'name', operator: 'equal', value: 'blbl' },
            ],
          }),
        };

        const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Posts', 'list', collectionListParameters);
        expect(result).toBeUndefined();
      });
    });

    describe('when the request does not match with the expected scope', () => {
      it('should return a rejected promise when only a part of the scope is found', async () => {
        expect.assertions(1);

        PermissionsChecker.resetExpiration(1);
        PermissionsChecker.cleanCache();
        nock.cleanAll();
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, scopedCollectionResponse);

        const collectionListParameters = {
          userId: 100,
          filters: JSON.stringify({
            field: 'name', operator: 'equal', value: 'John',
          }),
        };

        await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list', collectionListParameters))
          .rejects.toThrow("'list' access forbidden on Users");
      });

      it('should return a rejected promise when editing direct values', async () => {
        expect.assertions(1);

        PermissionsChecker.resetExpiration(1);
        PermissionsChecker.cleanCache();
        nock.cleanAll();
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, scopedCollectionResponse);

        const collectionListParameters = {
          userId: 100,
          filters: JSON.stringify({
            aggregator: 'and',
            conditions: [
              { field: 'name', operator: 'equal', value: 'DefinitelyNotJohn' },
              { field: 'name', operator: 'equal', value: 'DefinitelyNotAdmin' },
            ],
          }),
        };

        await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list', collectionListParameters))
          .rejects.toThrow("'list' access forbidden on Users");
      });

      it('should return a rejected promise if scope is ignored', async () => {
        expect.assertions(1);

        PermissionsChecker.resetExpiration(1);
        PermissionsChecker.cleanCache();
        nock.cleanAll();
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, scopedCollectionResponse);

        const collectionListParameters = {
          userId: 100,
          filters: JSON.stringify({
            aggregator: 'or',
            conditions: [
              { field: 'name', operator: 'equal', value: 'valueThatIWantToGet' },
              {
                aggregator: 'and',
                conditions: [
                  { field: 'name', operator: 'equal', value: 'John' },
                  { field: 'name', operator: 'equal', value: 'Admin' },
                ],
              },
            ],
          }),
        };

        await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list', null, collectionListParameters))
          .rejects.toThrow("'list' access forbidden on Users");
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
        expect(retrievedPermissions).toBeUndefined();

        const permissions = {
          Users: {
            collection: {
              list: true,
            },
          },
        };

        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions);

        await new PermissionsChecker('envSecret', 1)
          .checkPermissions('Users', 'list')
          .then(() => {
            retrievedPermissions = PermissionsChecker.getPermissions(1).data;
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
        PermissionsChecker.expirationInSeconds = 1;

        const intialLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);
        const initialRetrievedPermissions = PermissionsChecker.getPermissions(1);

        expect(intialLastRetrieve).toBeNull();
        expect(initialRetrievedPermissions).toBeUndefined();

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

        await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list');

        const firstRetrievedPermissions = PermissionsChecker.getPermissions(1).data;
        const firstLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

        expect(firstRetrievedPermissions).toStrictEqual(permissions1);
        expect(firstLastRetrieve).not.toBeNull();

        await new Promise((resolve) => { setTimeout(() => resolve(), 1200); });
        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions2);

        await new PermissionsChecker('envSecret', 1)
          .checkPermissions('Users', 'list')
          .then(() => {
            const secondRetrievedPermissions = PermissionsChecker.getPermissions(1).data;
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
        PermissionsChecker.expirationInSeconds = 1000;

        const intialLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);
        const initialRetrievedPermissions = PermissionsChecker.getPermissions(1);

        expect(intialLastRetrieve).toBeNull();
        expect(initialRetrievedPermissions).toBeUndefined();

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

        await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list');

        const firstRetrievedPermissions = PermissionsChecker.getPermissions(1).data;
        const firstLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

        expect(firstRetrievedPermissions).toStrictEqual(permissions1);
        expect(firstLastRetrieve).not.toBeNull();

        nockObj.get('/liana/v2/permissions?renderingId=1').reply(200, permissions2);

        new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'list');
        const secondRetrievedPermissions = PermissionsChecker.getPermissions(1).data;
        const secondLastRetrieve = PermissionsChecker.getLastRetrieveTime(1);

        expect(secondRetrievedPermissions).toStrictEqual(permissions1);
        expect(secondLastRetrieve.valueOf()).toStrictEqual(firstLastRetrieve.valueOf());
      });
    });
  });
});
