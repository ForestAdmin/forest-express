const nock = require('nock');
const PermissionsChecker = require('../../src/services/permissions-checker');
const context = require('../../src/context/');
const initContext = require('../../src/context/init');

context.init(initContext);
const { configStore } = context.inject();
configStore.lianaOptions = { envSecret: 'envSecret' };

describe('services > permissions', () => {
  const { forestUrl } = context.inject();
  const nockObj = nock(forestUrl);
  const resetAndClearCache = () => {
    const { permissionsGetter } = context.inject();
    permissionsGetter.resetExpiration(1);
    permissionsGetter.cleanCache();
  };

  describe('with teamsACL permissions format', () => {
    describe('check permissions', () => {
      describe('with some good permissions data on rendering 1', () => {
        const permissionTypes = [
          { responseName: 'list', permissionName: 'browseEnabled' },
          { responseName: 'searchToEdit', permissionName: 'browseEnabled' },
          { responseName: 'show', permissionName: 'readEnabled' },
          { responseName: 'update', permissionName: 'editEnabled' },
          { responseName: 'create', permissionName: 'addEnabled' },
          { responseName: 'delete', permissionName: 'deleteEnabled' },
          { responseName: 'export', permissionName: 'exportEnabled' },
        ];

        permissionTypes.forEach((type) => {
          describe(`with the "${type.responseName}" permission`, () => {
            it('should return a resolved promise', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.get('/liana/v3/permissions?renderingId=1')
                .reply(200, {
                  meta: { rolesACLActivated: false },
                  data: {
                    Users: {
                      collection: {
                        [type.responseName]: true,
                      },
                    },
                  },
                });

              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', type.permissionName, { userId: 1 }))
                .toResolve();
            });
          });

          describe(`without the "${type.responseName}" permission`, () => {
            it('should return a rejected promise', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.persist().get('/liana/v3/permissions?renderingId=1')
                .reply(200, {
                  meta: { rolesACLActivated: false },
                  data: {
                    Users: {
                      collection: {
                        [type.responseName]: false,
                      },
                    },
                  },
                });

              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', type.permissionName, { userId: 1 }))
                .rejects.toThrow(`'${type.permissionName}' access forbidden on Users`);
              nockObj.persist(false);
            });
          });
        });

        describe('check if it requests permissions after a denied access', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1')
              .reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {
                      list: true,
                    },
                  },
                },
              });

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 }))
              .toResolve();
          });
        });
      });

      describe('with some good permissions data on rendering 2', () => {
        describe('with the "list" permission', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=2')
              .reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {
                      list: true,
                    },
                  },
                },
              });

            await expect(new PermissionsChecker(context.inject()).checkPermissions(2, 'Users', 'browseEnabled', { userId: 1 }))
              .toResolve();
          });
        });
      });

      describe('with some bad permissions data', () => {
        it('should return a rejected promise', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {});

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 }))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
          nockObj.persist(false);
        });
      });

      describe('handling smart action permissions', () => {
        describe('if no smart action permissions are available', () => {
          it('should return a rejected promise', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {
              Users: {
                meta: { rolesACLActivated: false },
                data: {
                  collection: {},
                  actions: {},
                },
              },
            });

            const smartActionParameters = {
              actionName: 'save',
              userId: 1,
            };

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
              .rejects.toThrow("'actions' access forbidden on Users");
            nockObj.persist(false);
          });
        });

        describe('if smart action permissions are available', () => {
          describe('if the smart action is not allowed to be executed', () => {
            it('should return a rejected promise', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {},
                    actions: {
                      save: {
                        allowed: false,
                        users: null,
                      },
                      copy: {
                        allowed: true,
                        users: null,
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: 1,
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .rejects.toThrow("'actions' access forbidden on Users");
              nockObj.persist(false);
            });
          });

          describe('if the smart action is allowed to everyone', () => {
            it('should return a resolved promise', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {},
                    actions: {
                      save: {
                        allowed: true,
                        users: null,
                      },
                      copy: {
                        allowed: true,
                        users: null,
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: 1,
              };

              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .toResolve();
            });
          });

          describe('if the smart action is restricted to some users', () => {
            it('should accept allowed users', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {},
                    actions: {
                      save: {
                        allowed: true,
                        users: [1],
                      },
                      copy: {
                        allowed: true,
                        users: null,
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: 1,
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .toResolve();
            });

            it('should refuse not allowed users', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {},
                    actions: {
                      save: {
                        allowed: true,
                        users: [1],
                      },
                      copy: {
                        allowed: true,
                        users: null,
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: 2,
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .rejects.toThrow("'actions' access forbidden on Users");
              nockObj.persist(false);
            });
          });

          describe('handling the user triggering the action', () => {
            it('should handle the user id as string', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {},
                    actions: {
                      save: {
                        allowed: true,
                        users: [1],
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: '1',
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .toResolve();
            });
          });
        });
      });
    });

    describe('handling user list on collection with scope', () => {
      const scopedCollectionResponse = {
        meta: { rolesACLActivated: false },
        data: {
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
        },
      };

      describe('when the request match with the expected scope', () => {
        describe('without additional filters', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
              .toResolve();
          });

          it('should return a resolved promise when scope uses a single scope', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

            const collectionListParameters = {
              userId: 100,
              filters: JSON.stringify(
                { field: 'name', operator: 'equal', value: 'toto' },
              ),
            };

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Posts', 'browseEnabled', collectionListParameters))
              .toResolve();
          });
        });

        describe('with additional filters', () => {
          it('should return a resolved promise when sending scope and manual filters', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
              .toResolve();
          });
        });

        it('should return a resolved promise when scope uses a single scope', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Posts', 'browseEnabled', collectionListParameters))
            .toResolve();
        });
      });

      describe('when the request does not match with the expected scope', () => {
        it('should return a rejected promise when only a part of the scope is found', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

          const collectionListParameters = {
            userId: 100,
            filters: JSON.stringify({
              field: 'name', operator: 'equal', value: 'John',
            }),
          };

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
          nockObj.persist(false);
        });

        it('should return a rejected promise when editing direct values', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
          nockObj.persist(false);
        });

        it('should return a rejected promise if scope is ignored', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
          nockObj.persist(false);
        });
      });
    });

    describe('check expiration', () => {
      function resetNock() {
        const { permissionsGetter } = context.inject();
        permissionsGetter.resetExpiration(1);
        permissionsGetter.cleanCache();
        nock.cleanAll();
      }

      describe('with permissions never retrieved', () => {
        it('should retrieve the permissions', async () => {
          expect.assertions(4);
          resetNock();
          const { permissionsGetter, permissionsFormatter } = context.inject();
          let lastRetrieve = permissionsGetter._getLastRetrieveTimeInRendering(1);
          let retrievedPermissions = permissionsGetter._getPermissionsInRendering(1);

          expect(lastRetrieve).toBeNull();
          expect(retrievedPermissions).toBeNull();

          const permissions = {
            meta: { rolesACLActivated: false },
            data: {
              Users: {
                collection: {
                  list: true,
                },
              },
            },
          };

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions);

          await new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          })
            .checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 })
            .then(() => {
              retrievedPermissions = permissionsGetter._getPermissionsInRendering(1);
              lastRetrieve = permissionsGetter._getLastRetrieveTimeInRendering(1);

              expect(lastRetrieve).not.toBeNull();
              const permissionsInNewFormat = permissionsFormatter
                .transformPermissionsFromOldToNewFormat(permissions.data);
              expect(retrievedPermissions.data).toStrictEqual(permissionsInNewFormat);
            });
        });
      });

      describe('with permissions expired', () => {
        it('should re-retrieve the permissions', async () => {
          expect.assertions(6);
          resetNock();
          const { permissionsGetter, permissionsFormatter } = context.inject();
          permissionsGetter.expirationInSeconds = 1;

          const intialLastRetrieve = permissionsGetter._getLastRetrieveTimeInRendering(1);
          const initialRetrievedPermissions = permissionsGetter._getPermissionsInRendering(1);

          expect(intialLastRetrieve).toBeNull();
          expect(initialRetrievedPermissions).toBeNull();

          const permissions1 = {
            meta: { rolesACLActivated: false },
            data: {
              Users: {
                collection: {
                  list: true,
                },
              },
            },
          };

          const permissions2 = {
            meta: { rolesACLActivated: false },
            data: {
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
            },
          };

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions1);

          await new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 });

          const firstRetrievedPermissions = permissionsGetter._getPermissionsInRendering(1);
          const firstLastRetrieve = permissionsGetter._getLastRetrieveTimeInRendering(1);
          const permissions1InNewFormat = permissionsFormatter
            .transformPermissionsFromOldToNewFormat(permissions1.data);

          expect(firstRetrievedPermissions.data).toStrictEqual(permissions1InNewFormat);
          expect(firstLastRetrieve).not.toBeNull();

          await new Promise((resolve) => { setTimeout(() => resolve(), 1200); });
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions2);

          await new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          })
            .checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 })
            .then(() => {
              const secondRetrievedPermissions = permissionsGetter._getPermissionsInRendering(1);
              const secondLastRetrieve = permissionsGetter._getLastRetrieveTimeInRendering(1);
              const permissions2InNewFormat = permissionsFormatter
                .transformPermissionsFromOldToNewFormat(permissions2.data);

              expect(secondRetrievedPermissions.data).toStrictEqual(permissions2InNewFormat);
              expect(secondLastRetrieve - firstLastRetrieve > 0).toStrictEqual(true);
            });
        });
      });

      describe('with permissions not expired', () => {
        it('should not re-retrieve the permissions', async () => {
          expect.assertions(6);
          resetNock();
          const { permissionsGetter, permissionsFormatter } = context.inject();
          permissionsGetter.expirationInSeconds = 1000;

          const intialLastRetrieve = permissionsGetter._getLastRetrieveTimeInRendering(1);
          const initialRetrievedPermissions = permissionsGetter._getPermissionsInRendering(1);

          expect(intialLastRetrieve).toBeNull();
          expect(initialRetrievedPermissions).toBeNull();

          const permissions1 = {
            meta: { rolesACLActivated: false },
            data: {
              Users: {
                collection: {
                  list: true,
                },
              },
            },
          };

          const permissions2 = {
            meta: { rolesACLActivated: false },
            data: {
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
            },
          };

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions1);

          await new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 });

          const firstRetrievedPermissions = permissionsGetter._getPermissionsInRendering(1);
          const firstLastRetrieve = permissionsGetter._getLastRetrieveTimeInRendering(1);
          const permissions1InNewFormat = permissionsFormatter
            .transformPermissionsFromOldToNewFormat(permissions1.data);

          expect(firstRetrievedPermissions.data).toStrictEqual(permissions1InNewFormat);
          expect(firstLastRetrieve).not.toBeNull();

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions2);

          new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 });
          const secondRetrievedPermissions = permissionsGetter._getPermissionsInRendering(1);
          const secondLastRetrieve = permissionsGetter._getLastRetrieveTimeInRendering(1);

          expect(secondRetrievedPermissions.data).toStrictEqual(permissions1InNewFormat);
          expect(secondLastRetrieve.valueOf()).toStrictEqual(firstLastRetrieve.valueOf());
        });
      });
    });
  });

  describe('with rolesACL permissions format', () => {
    describe('check permissions', () => {
      describe('with some good permissions data on rendering 1', () => {
        const permissionTypes = ['browseEnabled', 'readEnabled', 'editEnabled', 'addEnabled', 'deleteEnabled', 'exportEnabled'];

        permissionTypes.forEach((type) => {
          describe(`with the "${type}" permission`, () => {
            it('should return a resolved promise', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.get('/liana/v3/permissions?renderingId=1')
                .reply(200, {
                  meta: { rolesACLActivated: true },
                  data: {
                    collections: {
                      Users: {
                        collection: {
                          [type]: true,
                        },
                      },
                    },
                  },
                });
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', type, { userId: 1 }))
                .toResolve();
            });
          });

          describe(`without the "${type}" permission`, () => {
            it('should return a rejected promise', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.persist().get('/liana/v3/permissions?renderingId=1')
                .reply(200, {
                  meta: { rolesACLActivated: true },
                  data: {
                    collections: {
                      Users: {
                        collection: {
                          [type]: false,
                        },
                      },
                    },
                  },
                });
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', type, { userId: 1 }))
                .rejects.toThrow(`'${type}' access forbidden on Users`);
              nockObj.persist(false);
            });
          });
        });

        describe('check if it requests permissions after a denied access', () => {
          it('should return a resolve promise', async () => {
            expect.assertions(1);

            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1')
              .reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {
                        addEnabled: true,
                      },
                    },
                  },
                },
              });

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'addEnabled', { userId: 1 }))
              .toResolve();
          });
        });
      });

      describe('with some good permissions data on rendering 2', () => {
        describe('with the "browseEnabled" permission', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=2')
              .reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {
                        browseEnabled: true,
                      },
                    },
                  },
                },
              });

            await expect(new PermissionsChecker(context.inject()).checkPermissions(2, 'Users', 'browseEnabled', { userId: 1 }))
              .toResolve();
          });
        });

        describe('with the permissions from rendering 1 not expired', () => {
          describe('with a permission different from browseEnabled', () => {
            it('should not retrieve any permissions for rendering 2', async () => {
              expect.assertions(6);

              const permissions1 = {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {
                        addEnabled: true,
                        browseEnabled: true,
                        deleteEnabled: false,
                        editEnabled: false,
                        exportEnabled: false,
                        readEnabled: false,
                      },
                    },
                  },
                  renderings: {
                    1: {},
                  },
                },
              };

              const permissions2 = {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {
                        addEnabled: true,
                        browseEnabled: true,
                        deleteEnabled: false,
                        editEnabled: false,
                        exportEnabled: false,
                        readEnabled: false,
                      },
                    },
                  },
                  renderings: {
                    2: {},
                  },
                },
              };

              resetAndClearCache();
              nock.cleanAll();

              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions1);
              await new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'addEnabled', { userId: 1 });

              const { permissionsGetter } = context.inject();
              const retrievedPermissions1 = permissionsGetter._getPermissionsInCollections(1);
              const lastRetrieveInCollections1 = permissionsGetter
                ._getLastRetrieveTimeInCollections();
              const lastRetrieveInRendering1 = permissionsGetter._getLastRetrieveTimeInRendering(1);

              expect(retrievedPermissions1.data).toStrictEqual(permissions1.data.collections);
              expect(lastRetrieveInCollections1).not.toBeNull();
              expect(lastRetrieveInRendering1).not.toBeNull();

              nockObj.get('/liana/v3/permissions?renderingId=2').reply(200, permissions2);

              await new PermissionsChecker(context.inject()).checkPermissions(2, 'Users', 'addEnabled', { userId: 1 });

              const retrievedPermissions2 = permissionsGetter._getPermissionsInCollections(1);
              const lastRetrieveInCollections2 = permissionsGetter
                ._getLastRetrieveTimeInCollections();
              const lastRetrieveInRendering2 = permissionsGetter._getLastRetrieveTimeInRendering(2);

              expect(retrievedPermissions2.data).toStrictEqual(permissions1.data.collections);
              expect(lastRetrieveInCollections2.valueOf())
                .toStrictEqual(lastRetrieveInCollections1.valueOf());
              expect(lastRetrieveInRendering2).toBeNull();
            });
          });

          describe('with the browseEnabled permission', () => {
            it('should retrieve the rendering permissions only for rendering 2', async () => {
              expect.assertions(6);

              const permissions = {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {
                        addEnabled: false,
                        browseEnabled: true,
                        deleteEnabled: false,
                        editEnabled: false,
                        exportEnabled: false,
                        readEnabled: false,
                      },
                    },
                  },
                  renderings: {
                    1: {},
                  },
                },
              };

              const renderingOnlyPermissions = {
                meta: { rolesACLActivated: true },
                data: {
                  renderings: {
                    2: {},
                  },
                },
              };

              resetAndClearCache();
              nock.cleanAll();

              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions);
              await new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 });

              const { permissionsGetter } = context.inject();
              const retrievedPermissions1 = permissionsGetter._getPermissionsInCollections(1);
              const lastRetrieveInCollections1 = permissionsGetter
                ._getLastRetrieveTimeInCollections();
              const lastRetrieveInRendering1 = permissionsGetter._getLastRetrieveTimeInRendering(1);

              expect(retrievedPermissions1.data).toStrictEqual(permissions.data.collections);
              expect(lastRetrieveInCollections1).not.toBeNull();
              expect(lastRetrieveInRendering1).not.toBeNull();

              await new Promise((resolve) => { setTimeout(() => resolve(), 50); });

              nockObj.get('/liana/v3/permissions?renderingId=2&renderingSpecificOnly=true').reply(200, renderingOnlyPermissions);

              await new PermissionsChecker(context.inject()).checkPermissions(2, 'Users', 'browseEnabled', { userId: 1 });
              const retrievedPermissions2 = permissionsGetter._getPermissionsInCollections(2);
              const lastRetrieveInCollections2 = permissionsGetter
                ._getLastRetrieveTimeInCollections();
              const lastRetrieveInRendering2 = permissionsGetter
                ._getLastRetrieveTimeInRendering(2);

              expect(retrievedPermissions2.data).toStrictEqual(permissions.data.collections);
              expect(lastRetrieveInRendering2 - lastRetrieveInRendering1 > 0)
                .toStrictEqual(true);
              expect(lastRetrieveInCollections1.valueOf())
                .toStrictEqual(lastRetrieveInCollections2.valueOf());
            });
          });
        });
      });

      describe('handling smart action permissions', () => {
        describe('if no smart action permissions are available', () => {
          it('should return a rejected promise', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {
              Users: {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    collection: {},
                    actions: {},
                  },
                },
              },
            });

            const smartActionParameters = {
              actionName: 1,
              userId: 1,
            };

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
              .rejects.toThrow("'actions' access forbidden on Users");
            nockObj.persist(false);
          });
        });

        describe('if smart action permissions are available', () => {
          describe('if the smart action is not allowed to be executed', () => {
            it('should return a rejected promise', async () => {
              expect.assertions(1);

              nock.cleanAll();
              nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {},
                      actions: {
                        save: {
                          triggerEnabled: false,
                        },
                        copy: {
                          triggerEnabled: true,
                        },
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: 1,
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .rejects.toThrow("'actions' access forbidden on Users");
              nockObj.persist(false);
            });
          });

          describe('if the smart action is allowed to everyone', () => {
            it('should return a resolved promise', async () => {
              expect.assertions(1);

              nock.cleanAll();
              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {},
                      actions: {
                        save: {
                          triggerEnabled: true,
                        },
                        copy: {
                          triggerEnabled: true,
                        },
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: 1,
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .toResolve();
            });
          });

          describe('if the smart action is restricted to some users', () => {
            it('should accept allowed users', async () => {
              expect.assertions(1);

              nock.cleanAll();
              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {},
                      actions: {
                        save: {
                          triggerEnabled: [1],
                        },
                        copy: {
                          triggerEnabled: [5],
                        },
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: 1,
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .toResolve();
            });

            it('should refuse not allowed users', async () => {
              expect.assertions(1);

              resetAndClearCache();
              nock.cleanAll();
              nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {},
                      actions: {
                        save: {
                          triggerEnabled: [1],
                        },
                        copy: {
                          triggerEnabled: [5],
                        },
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: 2,
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .rejects.toThrow("'actions' access forbidden on Users");
              nockObj.persist(false);
            });
          });

          describe('handling the user triggering the action', () => {
            it('should handle the user id as string', async () => {
              expect.assertions(1);

              nock.cleanAll();
              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {},
                      actions: {
                        save: {
                          triggerEnabled: [1],
                        },
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
                userId: '1',
              };
              await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'actions', smartActionParameters))
                .toResolve();
            });
          });
        });
      });
    });

    describe('handling user list on collection with scope', () => {
      const scopedCollectionResponse = {
        meta: { rolesACLActivated: true },
        data: {
          collections: {
            Users: {
              collection: {
                browseEnabled: true,
              },
            },
            Posts: {
              collection: {
                browseEnabled: true,
              },
            },
          },
          renderings: {
            1: {
              Users: {
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
            },
          },
        },
      };

      describe('when the request match with the expected scope', () => {
        describe('without additional filters', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
              .toResolve();
          });

          it('should return a resolved promise when scope uses a single scope', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

            const collectionListParameters = {
              userId: 100,
              filters: JSON.stringify(
                { field: 'name', operator: 'equal', value: 'toto' },
              ),
            };

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Posts', 'browseEnabled', collectionListParameters))
              .toResolve();
          });
        });

        describe('with additional filters', () => {
          it('should return a resolved promise when sending scope and manual filters', async () => {
            expect.assertions(1);

            resetAndClearCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

            await expect(new PermissionsChecker(context.inject()).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
              .toResolve();
          });
        });

        it('should return a resolved promise when scope uses a single scope', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Posts', 'browseEnabled', collectionListParameters))
            .toResolve();
        });
      });

      describe('when the request does not match with the expected scope', () => {
        it('should return a rejected promise when only a part of the scope is found', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

          const collectionListParameters = {
            userId: 100,
            filters: JSON.stringify({
              field: 'name', operator: 'equal', value: 'John',
            }),
          };

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
          nockObj.persist(false);
        });

        it('should return a rejected promise when editing direct values', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
          nockObj.persist(false);
        });

        it('should return a rejected promise if scope is ignored', async () => {
          expect.assertions(1);

          resetAndClearCache();
          nock.cleanAll();
          nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
          nockObj.persist(false);
        });
      });
    });

    describe('check expiration', () => {
      function resetNock() {
        const { permissionsGetter } = context.inject();
        permissionsGetter.resetExpiration(1);
        permissionsGetter.cleanCache();
        nock.cleanAll();
      }

      describe('with permissions never retrieved', () => {
        it('should retrieve the permissions', async () => {
          expect.assertions(4);
          resetNock();
          const { permissionsGetter } = context.inject();
          let retrievedPermissions = permissionsGetter._getPermissionsInCollections(1);
          let lastRetrieve = permissionsGetter._getLastRetrieveTimeInCollections();

          expect(retrievedPermissions).toBeUndefined();
          expect(lastRetrieve).toBeNull();

          const permissions = {
            meta: { rolesACLActivated: true },
            data: {
              collections: {
                Users: {
                  collection: {
                    addEnabled: false,
                    browseEnabled: true,
                    deleteEnabled: false,
                    editEnabled: false,
                    exportEnabled: false,
                    readEnabled: false,
                  },
                },
              },
            },
          };

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions);

          await new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          })
            .checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 })
            .then(() => {
              retrievedPermissions = permissionsGetter._getPermissionsInCollections(1);
              lastRetrieve = permissionsGetter._getLastRetrieveTimeInCollections();

              expect(retrievedPermissions.data).toStrictEqual(permissions.data.collections);
              expect(lastRetrieve).not.toBeNull();
            });
        });
      });

      describe('with permissions expired', () => {
        it('should re-retrieve the permissions', async () => {
          expect.assertions(6);
          resetNock();

          const { permissionsGetter } = context.inject();
          permissionsGetter.expirationInSeconds = 1;

          const intialLastRetrieve = permissionsGetter._getLastRetrieveTimeInCollections();
          const initialRetrievedPermissions = permissionsGetter._getPermissionsInCollections(1);

          expect(intialLastRetrieve).toBeNull();
          expect(initialRetrievedPermissions).toBeUndefined();

          const permissions1 = {
            meta: { rolesACLActivated: true },
            data: {
              collections: {
                Users: {
                  collection: {
                    addEnabled: false,
                    browseEnabled: true,
                    deleteEnabled: false,
                    editEnabled: false,
                    exportEnabled: false,
                    readEnabled: false,
                  },
                },
              },
            },
          };

          const permissions2 = {
            meta: { rolesACLActivated: true },
            data: {
              collections: {
                Users: {
                  collection: {
                    addEnabled: false,
                    browseEnabled: true,
                    deleteEnabled: false,
                    editEnabled: false,
                    exportEnabled: false,
                    readEnabled: false,
                  },
                },
                Posts: {
                  collection: {
                    addEnabled: false,
                    browseEnabled: false,
                    deleteEnabled: false,
                    editEnabled: false,
                    exportEnabled: false,
                    readEnabled: false,
                  },
                },
              },
            },
          };

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions1);

          await new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          }).checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 });

          const firstRetrievedPermissions = permissionsGetter._getPermissionsInCollections(1);
          const firstLastRetrieve = permissionsGetter._getLastRetrieveTimeInCollections();

          expect(firstRetrievedPermissions.data).toStrictEqual(permissions1.data.collections);
          expect(firstLastRetrieve).not.toBeNull();

          await new Promise((resolve) => { setTimeout(() => resolve(), 1200); });
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions2);

          await new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          })
            .checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 })
            .then(() => {
              const secondRetrievedPermissions = permissionsGetter._getPermissionsInCollections(1);
              const secondLastRetrieve = permissionsGetter._getLastRetrieveTimeInCollections();

              expect(secondRetrievedPermissions.data).toStrictEqual(permissions2.data.collections);
              expect(secondLastRetrieve - firstLastRetrieve > 0).toStrictEqual(true);
            });
        });
      });

      describe('with permissions not expired', () => {
        it('should not re-retrieve the permissions', async () => {
          expect.assertions(6);

          resetNock();
          const { permissionsGetter } = context.inject();
          permissionsGetter.expirationInSeconds = 1000;

          const intialLastRetrieve = permissionsGetter._getLastRetrieveTimeInCollections();
          const initialRetrievedPermissions = permissionsGetter._getPermissionsInCollections(1);

          expect(intialLastRetrieve).toBeNull();
          expect(initialRetrievedPermissions).toBeUndefined();

          const permissions1 = {
            meta: { rolesACLActivated: true },
            data: {
              collections: {
                Users: {
                  collection: {
                    addEnabled: false,
                    browseEnabled: true,
                    deleteEnabled: false,
                    editEnabled: false,
                    exportEnabled: false,
                    readEnabled: false,
                  },
                },
              },
              renderings: {
                1: {},
              },
            },
          };

          const permissions2 = {
            meta: { rolesACLActivated: true },
            data: {
              collections: {
                Users: {
                  collection: {
                    addEnabled: false,
                    browseEnabled: true,
                    deleteEnabled: false,
                    editEnabled: false,
                    exportEnabled: false,
                    readEnabled: false,
                  },
                },
                Posts: {
                  collection: {
                    addEnabled: false,
                    browseEnabled: false,
                    deleteEnabled: false,
                    editEnabled: false,
                    exportEnabled: false,
                    readEnabled: false,
                  },
                },
              },
            },
          };

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions1);

          const permissionsChecker = new PermissionsChecker({
            ...context.inject(),
            configStore: {
              lianaOptions: {
                envSecret: 'envSecret',
              },
            },
          });
          await permissionsChecker.checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 });

          const firstRetrievedPermissions = permissionsGetter._getPermissionsInCollections(1);
          const firstLastRetrieve = permissionsGetter._getLastRetrieveTimeInCollections();

          expect(firstRetrievedPermissions.data).toStrictEqual(permissions1.data.collections);
          expect(firstLastRetrieve).not.toBeNull();

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions2);

          await permissionsChecker.checkPermissions(1, 'Users', 'browseEnabled', { userId: 1 });
          const secondRetrievedPermissions = permissionsGetter._getPermissionsInCollections(1);
          const secondLastRetrieve = permissionsGetter._getLastRetrieveTimeInCollections();

          expect(secondRetrievedPermissions.data).toStrictEqual(permissions1.data.collections);
          expect(secondLastRetrieve.valueOf()).toStrictEqual(firstLastRetrieve.valueOf());
        });
      });
    });
  });

  describe('with live queries permissions', () => {
    describe('if the live query is not allowed to be executed', () => {
      it('should return a rejected promise', async () => {
        expect.assertions(1);

        resetAndClearCache();
        nock.cleanAll();
        nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {
          meta: { rolesACLActivated: false },
          data: {
            Users: {
              collection: {},
              actions: {
                save: {
                  allowed: false,
                  users: null,
                },
                copy: {
                  allowed: true,
                  users: null,
                },
              },
            },
          },
          stats: { queries: [] },
        });

        const liveQueryParameters = 'SELECT COUNT(*) AS value FROM products;';
        await expect(new PermissionsChecker(context.inject()).checkPermissions(1, null, 'liveQueries', liveQueryParameters))
          .rejects.toThrow("'liveQueries' access forbidden on ");
        nockObj.persist(false);
      });
    });

    describe('if the live query is allowed', () => {
      it('should return a resolved promise', async () => {
        expect.assertions(1);

        resetAndClearCache();
        nock.cleanAll();
        nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
          meta: { rolesACLActivated: false },
          data: {
            Users: {
              collection: {},
              actions: {
                save: {
                  allowed: true,
                  users: null,
                },
                copy: {
                  allowed: true,
                  users: null,
                },
              },
            },
          },
          stats: { queries: ['SELECT COUNT(*) AS value FROM products;'] },
        });

        const liveQueryParameters = 'SELECT COUNT(*) AS value FROM products;';
        await expect(new PermissionsChecker(context.inject()).checkPermissions(1, null, 'liveQueries', liveQueryParameters))
          .toResolve();
      });
    });
  });

  describe('with stats with parameters permissions', () => {
    describe('if is not allowed to be executed', () => {
      it('should return a rejected promise', async () => {
        expect.assertions(1);

        resetAndClearCache();
        nock.cleanAll();
        nockObj.persist().get('/liana/v3/permissions?renderingId=1').reply(200, {
          meta: { rolesACLActivated: false },
          data: {
            Users: {
              collection: {},
              actions: {
                save: {
                  allowed: false,
                  users: null,
                },
                copy: {
                  allowed: true,
                  users: null,
                },
              },
            },
          },
          stats: { values: [] },
        });

        const statsWithParameterParameters = { type: 'Value', someInfo: 'Count', otherInfo: 'SomeCollection' };
        await expect(new PermissionsChecker(context.inject()).checkPermissions(1, null, 'statWithParameters', statsWithParameterParameters))
          .rejects.toThrow("'statWithParameters' access forbidden on ");
        nockObj.persist(false);
      });
    });

    describe('if is allowed', () => {
      it('should return a resolved promise', async () => {
        expect.assertions(1);

        resetAndClearCache();
        nock.cleanAll();
        nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
          meta: { rolesACLActivated: false },
          data: {
            Users: {
              collection: {},
              actions: {
                save: {
                  allowed: true,
                  users: null,
                },
                copy: {
                  allowed: true,
                  users: null,
                },
              },
            },
          },
          stats: {
            values: [{
              id: 'awesomeValueChart', type: 'Value', someInfoWithSillyName: 'Count', otherInfo: 'SomeCollection',
            }],
          },
        });

        const statsWithParameterParameters = { type: 'Value', someInfo: 'Count', otherInfo: 'SomeCollection' };
        await expect(new PermissionsChecker(context.inject()).checkPermissions(1, null, 'statWithParameters', statsWithParameterParameters)).toResolve();
      });
    });
  });
});
