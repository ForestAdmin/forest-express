const nock = require('nock');
const PermissionsChecker = require('../../src/services/permissions-checker');
const context = require('../../src/context/');
const initContext = require('../../src/context/init');

context.init(initContext);

describe('services > permissions', () => {
  const { forestUrl } = context.inject();
  const nockObj = nock(forestUrl);

  describe('with teamsACL permissions format', () => {
    describe('check permissions', () => {
      describe('with some good permissions data on rendering 1', () => {
        describe('with the "list" permission', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
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

            await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 })
              .then(() => { expect(true).toStrictEqual(true); });
          });
        });

        describe('with the "searchToEdit" permission', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1')
              .reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {
                      searchToEdit: true,
                    },
                  },
                },
              });

            await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 })
              .then(() => { expect(true).toStrictEqual(true); });
          });
        });

        describe('without the "list" permission', () => {
          it('should return a rejected promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1')
              .reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {
                      list: false,
                    },
                  },
                },
              });

            await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 }))
              .rejects.toThrow("'browseEnabled' access forbidden on Users");
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

            await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 })
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

            await new PermissionsChecker('envSecret', 2).checkPermissions('Users', 'browseEnabled', { userId: 1 })
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
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {});

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 }))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
        });
      });

      describe('handling smart action permissions', () => {
        describe('if no smart action permissions are available', () => {
          it('should return a rejected promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
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
              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: false },
                data: {
                  Users: {
                    collection: {},
                    actions: {
                      save: {
                        allowed: false,
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
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
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

              const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'actions', smartActionParameters);
              expect(result).toBeUndefined();
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
          it('should return undefined', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
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

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters);
            expect(result).toBeUndefined();
          });

          it('should return undefined when scope uses a single scope', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

            const collectionListParameters = {
              userId: 100,
              filters: JSON.stringify(
                { field: 'name', operator: 'equal', value: 'toto' },
              ),
            };

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Posts', 'browseEnabled', collectionListParameters);
            expect(result).toBeUndefined();
          });
        });

        describe('with additional filters', () => {
          it('should return undefined when sending scope and manual filters', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
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

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters);
            expect(result).toBeUndefined();
          });
        });

        it('should return undefined when scope uses a single scope', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
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

          const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Posts', 'browseEnabled', collectionListParameters);
          expect(result).toBeUndefined();
        });
      });

      describe('when the request does not match with the expected scope', () => {
        it('should return a rejected promise when only a part of the scope is found', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

          const collectionListParameters = {
            userId: 100,
            filters: JSON.stringify({
              field: 'name', operator: 'equal', value: 'John',
            }),
          };

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
        });

        it('should return a rejected promise when editing direct values', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
        });

        it('should return a rejected promise if scope is ignored', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
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
          let lastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1);
          let retrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);

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

          await new PermissionsChecker('envSecret', 1)
            .checkPermissions('Users', 'browseEnabled', { userId: 1 })
            .then(() => {
              retrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
              lastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1);

              expect(lastRetrieve).not.toBeNull();
              const permissionsInNewFormat = PermissionsChecker
                .transformPermissionsFromOldToNewFormat(permissions.data);
              expect(retrievedPermissions).toStrictEqual(permissionsInNewFormat);
            });
        });
      });

      describe('with permissions expired', () => {
        it('should re-retrieve the permissions', async () => {
          expect.assertions(6);
          resetNock();
          PermissionsChecker.expirationInSeconds = 1;

          const intialLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1);
          const initialRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);

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

          await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 });

          const firstRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
          const firstLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1);
          const permissions1InNewFormat = PermissionsChecker
            .transformPermissionsFromOldToNewFormat(permissions1.data);

          expect(firstRetrievedPermissions).toStrictEqual(permissions1InNewFormat);
          expect(firstLastRetrieve).not.toBeNull();

          await new Promise((resolve) => { setTimeout(() => resolve(), 1200); });
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions2);

          await new PermissionsChecker('envSecret', 1)
            .checkPermissions('Users', 'browseEnabled', { userId: 1 })
            .then(() => {
              const secondRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
              const secondLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1);
              const permissions2InNewFormat = PermissionsChecker
                .transformPermissionsFromOldToNewFormat(permissions2.data);

              expect(secondRetrievedPermissions).toStrictEqual(permissions2InNewFormat);
              expect(secondLastRetrieve - firstLastRetrieve > 0).toStrictEqual(true);
            });
        });
      });

      describe('with permissions not expired', () => {
        it('should not re-retrieve the permissions', async () => {
          expect.assertions(6);
          resetNock();
          PermissionsChecker.expirationInSeconds = 1000;

          const intialLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1);
          const initialRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);

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

          await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 });

          const firstRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
          const firstLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1);
          const permissions1InNewFormat = PermissionsChecker
            .transformPermissionsFromOldToNewFormat(permissions1.data);

          expect(firstRetrievedPermissions).toStrictEqual(permissions1InNewFormat);
          expect(firstLastRetrieve).not.toBeNull();

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions2);

          new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 });
          const secondRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
          const secondLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1);

          expect(secondRetrievedPermissions).toStrictEqual(permissions1InNewFormat);
          expect(secondLastRetrieve.valueOf()).toStrictEqual(firstLastRetrieve.valueOf());
        });
      });
    });
  });

  describe('with rolesACL permissions format', () => {
    describe('check permissions', () => {
      describe('with some good permissions data on rendering 1', () => {
        describe('with the "browseEnabled" permission', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1')
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

            await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 })
              .then(() => { expect(true).toStrictEqual(true); });
          });
        });

        describe('without the "browseEnabled" permission', () => {
          it('should return a rejected promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1')
              .reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {
                        browseEnabled: false,
                      },
                    },
                  },
                },
              });

            await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 }))
              .rejects.toThrow("'browseEnabled' access forbidden on Users");
          });
        });

        describe('check if it requests permissions after a denied access', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1')
              .reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {
                        exportEnabled: true,
                      },
                    },
                  },
                },
              });

            await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'exportEnabled', { userId: 1 })
              .then(() => { expect(true).toStrictEqual(true); });
          });
        });
      });

      describe('with some good permissions data on rendering 2', () => {
        describe('with the "browseEnabled" permission', () => {
          it('should return a resolved promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
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

            await new PermissionsChecker('envSecret', 2).checkPermissions('Users', 'browseEnabled', { userId: 1 })
              .then(() => { expect(true).toStrictEqual(true); });
          });
        });

        describe('with the permissions from rendering 1 not expired', () => {
          describe('with a permission different from browseEnabled', () => {
            it('should not retrieve the collection permissions for rendering 2', async () => {
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
                    1: {
                      Users: {
                        scope: {},
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
                    2: {
                      Users: {
                        scope: {},
                      },
                    },
                  },
                },
              };

              PermissionsChecker.resetExpiration(1);
              PermissionsChecker.cleanCache();
              nock.cleanAll();

              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions1);

              await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'addEnabled', { userId: 1 });

              const firstRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
              const firstCollectionsLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1, 'addEnabled');
              const firstRenderingLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1, 'addEnabled');

              expect(firstRetrievedPermissions).toStrictEqual(permissions1.data.collections);
              expect(firstCollectionsLastRetrieve).not.toBeNull();

              nockObj.get('/liana/v3/permissions?renderingId=2').reply(200, permissions2);

              await new PermissionsChecker('envSecret', 2).checkPermissions('Users', 'addEnabled', { userId: 1 });
              const secondRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(2);
              const secondCollectionsLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(2, 'addEnabled');
              const secondRenderingLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(2, 'addEnabled');

              expect(secondRetrievedPermissions).toStrictEqual(firstRetrievedPermissions);
              expect(secondCollectionsLastRetrieve.valueOf())
                .toStrictEqual(firstCollectionsLastRetrieve.valueOf());
              expect(firstRenderingLastRetrieve.valueOf())
                .toStrictEqual(firstCollectionsLastRetrieve.valueOf());
              expect(secondRenderingLastRetrieve).toBeNull();
            });
          });

          describe('with the browseEnabled permission', () => {
            it('should retrieve the rendering only permissions for rendering 2', async () => {
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
                    1: {
                      Users: {},
                    },
                  },
                },
              };

              const renderingPermissions = {
                meta: { rolesACLActivated: true },
                data: {
                  renderings: {
                    2: {
                      Users: {},
                    },
                  },
                },
              };

              PermissionsChecker.resetExpiration(1);
              PermissionsChecker.cleanCache();
              nock.cleanAll();

              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions);

              await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 });

              const firstRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
              const firstCollectionsLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1, 'browseEnabled');
              const firstRenderingLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(1, 'browseEnabled');

              expect(firstRetrievedPermissions).toStrictEqual(permissions.data.collections);
              expect(firstCollectionsLastRetrieve).not.toBeNull();
              expect(firstRenderingLastRetrieve).not.toBeNull();

              nockObj.get('/liana/v3/permissions?renderingId=2&renderingSpecificOnly=true').reply(200, renderingPermissions);

              await new PermissionsChecker('envSecret', 2).checkPermissions('Users', 'browseEnabled', { userId: 1 });
              const secondRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(2);
              const secondCollectionsLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(2, 'browseEnabled');
              const secondRenderingLastRetrieve = PermissionsChecker.getRenderingLastRetrieveTime(2, 'browseEnabled');

              expect(secondRetrievedPermissions).toStrictEqual(permissions.data.collections);
              expect(secondRenderingLastRetrieve - firstRenderingLastRetrieve > 0)
                .toStrictEqual(true);
              expect(firstCollectionsLastRetrieve.valueOf())
                .toStrictEqual(secondCollectionsLastRetrieve.valueOf());
            });
          });
        });
      });

      describe('handling smart action permissions', () => {
        describe('if no smart action permissions are available', () => {
          it('should return a rejected promise', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
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
              nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, {
                meta: { rolesACLActivated: true },
                data: {
                  collections: {
                    Users: {
                      collection: {},
                      actions: {
                        save: {
                          triggerEnabled: false,
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
                      },
                    },
                  },
                },
              });

              const smartActionParameters = {
                actionName: 'save',
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

              const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'actions', smartActionParameters);
              expect(result).toBeUndefined();
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
          it('should return undefined', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
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

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters);
            expect(result).toBeUndefined();
          });

          it('should return undefined when scope uses a single scope', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
            nock.cleanAll();
            nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

            const collectionListParameters = {
              userId: 100,
              filters: JSON.stringify(
                { field: 'name', operator: 'equal', value: 'toto' },
              ),
            };

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Posts', 'browseEnabled', collectionListParameters);
            expect(result).toBeUndefined();
          });
        });

        describe('with additional filters', () => {
          it('should return undefined when sending scope and manual filters', async () => {
            expect.assertions(1);

            PermissionsChecker.resetExpiration(1);
            PermissionsChecker.cleanCache();
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

            const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters);
            expect(result).toBeUndefined();
          });
        });

        it('should return undefined when scope uses a single scope', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
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

          const result = await new PermissionsChecker('envSecret', 1).checkPermissions('Posts', 'browseEnabled', collectionListParameters);
          expect(result).toBeUndefined();
        });
      });

      describe('when the request does not match with the expected scope', () => {
        it('should return a rejected promise when only a part of the scope is found', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

          const collectionListParameters = {
            userId: 100,
            filters: JSON.stringify({
              field: 'name', operator: 'equal', value: 'John',
            }),
          };

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
        });

        it('should return a rejected promise when editing direct values', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
        });

        it('should return a rejected promise if scope is ignored', async () => {
          expect.assertions(1);

          PermissionsChecker.resetExpiration(1);
          PermissionsChecker.cleanCache();
          nock.cleanAll();
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, scopedCollectionResponse);

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

          await expect(new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', collectionListParameters))
            .rejects.toThrow("'browseEnabled' access forbidden on Users");
        });
      });
    });

    describe('check expiration', () => {
      function resetNock() {
        PermissionsChecker.resetExpiration(1);
        PermissionsChecker.cleanCache();
        nock.cleanAll();
      }

      describe('with collections permissions never retrieved', () => {
        it('should retrieve the permissions', async () => {
          expect.assertions(4);
          resetNock();
          let lastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1);
          let retrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);

          expect(lastRetrieve).toBeUndefined();
          expect(retrievedPermissions).toBeUndefined();

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

          await new PermissionsChecker('envSecret', 1)
            .checkPermissions('Users', 'browseEnabled', { userId: 1 })
            .then(() => {
              retrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
              lastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1);

              expect(lastRetrieve).not.toBeNull();
              expect(retrievedPermissions).toStrictEqual(permissions.data.collections);
            });
        });
      });

      describe('with collections permissions expired', () => {
        it('should re-retrieve the permissions', async () => {
          expect.assertions(6);
          resetNock();
          PermissionsChecker.expirationInSeconds = 1;

          const intialLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1);
          const initialRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);

          expect(intialLastRetrieve).toBeUndefined();
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

          await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 });

          const firstRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
          const firstLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1);

          expect(firstRetrievedPermissions).toStrictEqual(permissions1.data.collections);
          expect(firstLastRetrieve).not.toBeNull();

          await new Promise((resolve) => { setTimeout(() => resolve(), 1200); });
          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions2);

          await new PermissionsChecker('envSecret', 1)
            .checkPermissions('Users', 'browseEnabled', { userId: 1 })
            .then(() => {
              const secondRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
              const secondLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1);

              expect(secondRetrievedPermissions).toStrictEqual(permissions2.data.collections);
              expect(secondLastRetrieve - firstLastRetrieve > 0).toStrictEqual(true);
            });
        });
      });

      describe('with collections permissions not expired', () => {
        it('should not re-retrieve the permissions', async () => {
          expect.assertions(6);
          resetNock();
          PermissionsChecker.expirationInSeconds = 1000;

          const intialLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1);
          const initialRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);

          expect(intialLastRetrieve).toBeUndefined();
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

          await new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 });

          const firstRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
          const firstLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1);

          expect(firstRetrievedPermissions).toStrictEqual(permissions1.data.collections);
          expect(firstLastRetrieve).not.toBeNull();

          nockObj.get('/liana/v3/permissions?renderingId=1').reply(200, permissions2);

          new PermissionsChecker('envSecret', 1).checkPermissions('Users', 'browseEnabled', { userId: 1 });
          const secondRetrievedPermissions = PermissionsChecker.getCollectionsPermissions(1);
          const secondLastRetrieve = PermissionsChecker.getCollectionsLastRetrieveTime(1);

          expect(secondRetrievedPermissions).toStrictEqual(permissions1.data.collections);
          expect(secondLastRetrieve.valueOf()).toStrictEqual(firstLastRetrieve.valueOf());
        });
      });
    });
  });
});
