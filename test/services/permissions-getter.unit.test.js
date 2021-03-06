const moment = require('moment');
const VError = require('verror');
const PermissionsGetter = require('../../src/services/permissions-getter');

describe('services > PermissionsGetter', () => {
  const defaultDependencies = {
    env: {},
    configStore: {},
    forestServerRequester: {},
    moment,
    VError,
  };

  describe('_getPermissions', () => {
    it('should retrieve the permissions', () => {
      expect.assertions(1);

      const permissionsGetter = new PermissionsGetter(defaultDependencies);
      permissionsGetter.permissions = { test: 'me' };

      expect(permissionsGetter._getPermissions()).toStrictEqual({ test: 'me' });
    });

    describe('with environmentId', () => {
      it('should retrieve the permissions', () => {
        expect.assertions(3);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        permissionsGetter.permissions = { test: 'me' };

        expect(permissionsGetter._getPermissions({ environmentId: 'test' })).toStrictEqual('me');
        expect(permissionsGetter._getPermissions({ environmentId: 'unknown' })).toBeUndefined();
        expect(permissionsGetter._getPermissions({ environmentId: 'unknown', initIfNotExisting: true })).toStrictEqual({});
      });
    });
  });

  describe('_setRenderingPermissions', () => {
    it('should set the permissions', () => {
      expect.assertions(5);

      const permissions = 'superPermissions';
      const permissionsGetter = new PermissionsGetter(defaultDependencies);

      jest.spyOn(permissionsGetter, '_getPermissions');

      permissionsGetter._setRenderingPermissions(1, permissions);

      expect(permissionsGetter.permissions.renderings).toBeObject();
      expect(permissionsGetter.permissions.renderings[1]).toBeObject();
      expect(permissionsGetter.permissions.renderings[1].data).toStrictEqual(permissions);
      expect(new Date(permissionsGetter.permissions.renderings[1].lastRetrieve)).toBeValidDate();
      expect(permissionsGetter._getPermissions)
        .toHaveBeenCalledWith({ initIfNotExisting: true, environmentId: undefined });
    });

    describe('with environmentId', () => {
      it('should set correctly the permissions', () => {
        expect.assertions(6);

        const environmentId = 100;
        const permissions = 'superPermissions';
        const permissionsGetter = new PermissionsGetter(defaultDependencies);

        jest.spyOn(permissionsGetter, '_getPermissions');

        permissionsGetter._setRenderingPermissions(1, permissions, { environmentId });

        const permissionsToCheck = permissionsGetter.permissions[environmentId];
        expect(permissionsToCheck).toBeObject();
        expect(permissionsToCheck.renderings).toBeObject();
        expect(permissionsToCheck.renderings[1]).toBeObject();
        expect(permissionsToCheck.renderings[1].data).toStrictEqual(permissions);
        expect(new Date(permissionsToCheck.renderings[1].lastRetrieve)).toBeValidDate();
        expect(permissionsGetter._getPermissions)
          .toHaveBeenCalledWith({ environmentId, initIfNotExisting: true });
      });
    });
  });

  describe('_setCollectionsPermissions', () => {
    it('should set the permissions', () => {
      expect.assertions(3);

      const permissions = 'superPermissions';
      const permissionsGetter = new PermissionsGetter(defaultDependencies);

      permissionsGetter._setCollectionsPermissions(permissions);
      expect(permissionsGetter.permissions.collections).toBeObject();
      expect(permissionsGetter.permissions.collections.data).toStrictEqual(permissions);
      expect(new Date(permissionsGetter.permissions.collections.lastRetrieve)).toBeValidDate();
    });

    describe('with environmentId', () => {
      it('should set correctly the permissions', () => {
        expect.assertions(4);

        const environmentId = 100;
        const permissions = 'superPermissions';
        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        permissionsGetter._setCollectionsPermissions(permissions, { environmentId });
        const permissionsToCheck = permissionsGetter.permissions[environmentId];
        expect(permissionsToCheck).toBeObject();
        expect(permissionsToCheck.collections).toBeObject();
        expect(permissionsToCheck.collections.data).toStrictEqual(permissions);
        expect(new Date(permissionsToCheck.collections.lastRetrieve)).toBeValidDate();
      });
    });
  });

  describe('_setRolesACLPermissions', () => {
    it('should set the permissions', () => {
      expect.assertions(4);

      const permissions = {
        collections: 'collectionsPermissions',
        renderings: {
          1: 'renderingPermissions',
        },
      };

      const permissionsGetter = new PermissionsGetter(defaultDependencies);

      jest.spyOn(permissionsGetter, '_setRenderingPermissions');
      jest.spyOn(permissionsGetter, '_setCollectionsPermissions');

      permissionsGetter._setRolesACLPermissions(1, permissions);
      expect(permissionsGetter._setRenderingPermissions).toHaveBeenCalledTimes(1);
      expect(permissionsGetter._setRenderingPermissions).toHaveBeenCalledWith(1, 'renderingPermissions', { environmentId: undefined });
      expect(permissionsGetter._setCollectionsPermissions).toHaveBeenCalledTimes(1);
      expect(permissionsGetter._setCollectionsPermissions).toHaveBeenCalledWith('collectionsPermissions', { environmentId: undefined });
    });

    describe('with environmentId', () => {
      it('should set correctly the permissions', () => {
        expect.assertions(4);

        const environmentId = {};
        const permissions = {
          collections: 'collectionsPermissions',
          renderings: {
            1: 'renderingPermissions',
          },
        };

        const permissionsGetter = new PermissionsGetter(defaultDependencies);

        jest.spyOn(permissionsGetter, '_setRenderingPermissions').mockImplementation();
        jest.spyOn(permissionsGetter, '_setCollectionsPermissions').mockImplementation();

        permissionsGetter._setRolesACLPermissions(1, permissions, { environmentId });
        expect(permissionsGetter._setRenderingPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter._setRenderingPermissions).toHaveBeenCalledWith(1, 'renderingPermissions', { environmentId });
        expect(permissionsGetter._setCollectionsPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter._setCollectionsPermissions).toHaveBeenCalledWith('collectionsPermissions', { environmentId });
      });
    });
  });

  describe('_setPermissions', () => {
    describe('when isRolesACLActivated is true', () => {
      it('should set the permissions', () => {
        expect.assertions(3);

        const permissions = {
          collections: 'collectionsPermissions',
          renderings: {
            1: 'renderingPermissions',
          },
        };

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        permissionsGetter.isRolesACLActivated = true;

        jest.spyOn(permissionsGetter, '_setRolesACLPermissions');
        jest.spyOn(PermissionsGetter, '_transformPermissionsFromOldToNewFormat');

        permissionsGetter._setPermissions(1, permissions);
        expect(permissionsGetter._setRolesACLPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter._setRolesACLPermissions)
          .toHaveBeenCalledWith(1, permissions, { environmentId: undefined });
        expect(PermissionsGetter._transformPermissionsFromOldToNewFormat).not.toHaveBeenCalled();

        jest.restoreAllMocks();
      });

      describe('with environmentId', () => {
        it('should set correctly the permissions', () => {
          expect.assertions(3);

          const environmentId = 100;
          const permissions = {
            collections: 'collectionsPermissions',
            renderings: {
              1: 'renderingPermissions',
            },
          };

          const permissionsGetter = new PermissionsGetter(defaultDependencies);
          permissionsGetter.isRolesACLActivated = true;

          jest.spyOn(permissionsGetter, '_setRolesACLPermissions');
          jest.spyOn(PermissionsGetter, '_transformPermissionsFromOldToNewFormat');

          permissionsGetter._setPermissions(1, permissions, { environmentId });
          expect(permissionsGetter._setRolesACLPermissions).toHaveBeenCalledTimes(1);
          expect(permissionsGetter._setRolesACLPermissions)
            .toHaveBeenCalledWith(1, permissions, { environmentId });
          expect(PermissionsGetter._transformPermissionsFromOldToNewFormat).not.toHaveBeenCalled();

          jest.restoreAllMocks();
        });
      });
    });

    describe('when isRolesACLActivated is false', () => {
      it('should set the permissions', () => {
        expect.assertions(5);

        const permissions = {};

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        permissionsGetter.isRolesACLActivated = false;
        jest.spyOn(permissionsGetter, '_setRenderingPermissions');
        jest.spyOn(permissionsGetter, '_setCollectionsPermissions');
        jest.spyOn(PermissionsGetter, '_transformPermissionsFromOldToNewFormat');

        permissionsGetter._setPermissions(1, permissions);

        expect(permissionsGetter._setRenderingPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter._setRenderingPermissions)
          .toHaveBeenCalledWith(1, permissions, { environmentId: undefined });
        expect(permissionsGetter._setCollectionsPermissions).not.toHaveBeenCalled();
        expect(PermissionsGetter._transformPermissionsFromOldToNewFormat).toHaveBeenCalledTimes(1);
        expect(PermissionsGetter._transformPermissionsFromOldToNewFormat)
          .toHaveBeenCalledWith(permissions);

        jest.restoreAllMocks();
      });
    });

    describe('with environmentId', () => {
      it('should set the permissions', () => {
        expect.assertions(5);

        const environmentId = 100;
        const permissions = {};

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        permissionsGetter.isRolesACLActivated = false;
        jest.spyOn(permissionsGetter, '_setRenderingPermissions');
        jest.spyOn(permissionsGetter, '_setCollectionsPermissions');
        jest.spyOn(PermissionsGetter, '_transformPermissionsFromOldToNewFormat');

        permissionsGetter._setPermissions(1, permissions, { environmentId });

        expect(permissionsGetter._setRenderingPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter._setRenderingPermissions)
          .toHaveBeenCalledWith(1, permissions, { environmentId });
        expect(permissionsGetter._setCollectionsPermissions).not.toHaveBeenCalled();
        expect(PermissionsGetter._transformPermissionsFromOldToNewFormat).toHaveBeenCalledTimes(1);
        expect(PermissionsGetter._transformPermissionsFromOldToNewFormat)
          .toHaveBeenCalledWith(permissions);

        jest.restoreAllMocks();
      });
    });
  });

  describe('_isRegularRetrievalRequired', () => {
    describe('when isRolesACLActivated is true', () => {
      describe('when permissions are expired', () => {
        it('should return true', () => {
          expect.assertions(1);

          const permissionsGetter = new PermissionsGetter(defaultDependencies);

          permissionsGetter.isRolesACLActivated = true;
          permissionsGetter.permissions = {
            collections: {
              lastRetrieve: moment('1998-07-15'),
            },
            renderings: {
              1: {
                lastRetrieve: moment(),
              },
            },
          };

          expect(permissionsGetter._isRegularRetrievalRequired(1)).toBeTrue();
        });

        describe('with environmentId', () => {
          it('should return true', () => {
            expect.assertions(2);

            const permissionsGetter = new PermissionsGetter(defaultDependencies);

            permissionsGetter.isRolesACLActivated = true;
            permissionsGetter.permissions = {
              nested: {
                collections: {
                  lastRetrieve: moment('1998-07-15'),
                },
                renderings: {
                  1: {
                    lastRetrieve: moment(),
                  },
                },
              },
            };

            expect(permissionsGetter._isRegularRetrievalRequired(1, { environmentId: 'nested' })).toBeTrue();
            expect(permissionsGetter._isRegularRetrievalRequired(1, { environmentId: 'unknown' })).toBeTrue();
          });
        });
      });

      describe('when permissions are not expired', () => {
        it('should return false', () => {
          expect.assertions(1);

          const permissionsGetter = new PermissionsGetter(defaultDependencies);

          permissionsGetter.isRolesACLActivated = true;
          permissionsGetter.permissions = {
            collections: {
              lastRetrieve: moment(),
            },
            renderings: {
              1: {
                lastRetrieve: moment('1998-07-15'),
              },
            },
          };

          expect(permissionsGetter._isRegularRetrievalRequired(1)).toBeFalse();
        });

        describe('with environmentId', () => {
          it('should return false', () => {
            expect.assertions(1);

            const permissionsGetter = new PermissionsGetter(defaultDependencies);

            const environmentId = 100;
            permissionsGetter.isRolesACLActivated = true;
            permissionsGetter.permissions = {
              [environmentId]: {
                collections: {
                  lastRetrieve: moment(),
                },
                renderings: {
                  1: {
                    lastRetrieve: moment('1998-07-15'),
                  },
                },
              },
            };

            expect(permissionsGetter._isRegularRetrievalRequired(1, { environmentId }))
              .toBeFalse();
          });
        });
      });
    });
  });

  describe('_isRenderingOnlyRetrievalRequired', () => {
    describe('when isRolesACLActivated is true', () => {
      const permissionNames = ['addEnabled', 'editEnabled', 'deleteEnabled', 'readEnabled', 'exportEnabled'];

      permissionNames.forEach((permissionName) => {
        describe(`when called with ${permissionName}`, () => {
          it('should return false', () => {
            expect.assertions(1);

            const permissionsGetter = new PermissionsGetter(defaultDependencies);

            permissionsGetter.isRolesACLActivated = true;

            expect(permissionsGetter._isRenderingOnlyRetrievalRequired(1, permissionName))
              .toBeFalse();
          });
        });
      });
      describe('when called with browseEnabled', () => {
        describe('when permissions are expired', () => {
          it('should return true', () => {
            expect.assertions(1);

            const permissionsGetter = new PermissionsGetter(defaultDependencies);

            permissionsGetter.isRolesACLActivated = true;

            expect(permissionsGetter._isRenderingOnlyRetrievalRequired(1, 'browseEnabled')).toBeTrue();
          });
        });

        describe('when permissions are not expired', () => {
          it('should return true', () => {
            expect.assertions(1);

            const permissionsGetter = new PermissionsGetter(defaultDependencies);

            permissionsGetter.isRolesACLActivated = true;

            permissionsGetter.permissions = {
              renderings: {
                1: {
                  lastRetrieve: moment(),
                },
              },
            };

            expect(permissionsGetter._isRenderingOnlyRetrievalRequired(1, 'browseEnabled')).toBeFalse();
          });
        });
      });
    });

    describe('when isRolesACLActivated is false', () => {
      it('should return false', () => {
        expect.assertions(1);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);

        permissionsGetter.isRolesACLActivated = false;

        expect(permissionsGetter._isRenderingOnlyRetrievalRequired(1, 'browseEnabled')).toBeFalse();
      });
    });
  });

  describe('getPermissions', () => {
    describe('with forceRetrieve true', () => {
      it('should call _retrievePermissions', () => {
        expect.assertions(2);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        jest.spyOn(permissionsGetter, '_retrievePermissions').mockImplementation();

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled', { forceRetrieve: true });

        expect(permissionsGetter._retrievePermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter._retrievePermissions)
          .toHaveBeenCalledWith(1, { environmentId: undefined });
      });
    });

    describe('when global permissions are expired', () => {
      it('should call _retrievePermissions', () => {
        expect.assertions(2);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        jest.spyOn(permissionsGetter, '_retrievePermissions').mockImplementation();
        jest.spyOn(permissionsGetter, '_isRegularRetrievalRequired').mockImplementation().mockReturnValue(true);

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter._retrievePermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter._retrievePermissions)
          .toHaveBeenCalledWith(1, { environmentId: undefined });
      });

      describe('with environmentId', () => {
        it('should call _retrievePermissions', () => {
          expect.assertions(2);

          const permissionsGetter = new PermissionsGetter(defaultDependencies);
          jest.spyOn(permissionsGetter, '_retrievePermissions').mockImplementation();
          jest.spyOn(permissionsGetter, '_isRegularRetrievalRequired').mockImplementation().mockReturnValue(true);

          const environmentId = 1000;
          permissionsGetter.getPermissions(1, 'Users', 'addEnabled', { environmentId });

          expect(permissionsGetter._retrievePermissions).toHaveBeenCalledTimes(1);
          expect(permissionsGetter._retrievePermissions)
            .toHaveBeenCalledWith(1, { environmentId });
        });
      });
    });

    describe('when rendering permissions are expired', () => {
      it('should call _retrievePermissions with renderingOnly true', () => {
        expect.assertions(1);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        jest.spyOn(permissionsGetter, '_retrievePermissions').mockImplementation();
        jest.spyOn(permissionsGetter, '_isRegularRetrievalRequired').mockImplementation().mockReturnValue(false);
        jest.spyOn(permissionsGetter, '_isRenderingOnlyRetrievalRequired').mockImplementation().mockReturnValue(true);

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter._retrievePermissions)
          .toHaveBeenCalledWith(1, { renderingOnly: true });
      });

      describe('with environmentId', () => {
        it('should call _retrievePermissions with renderingOnly true', () => {
          expect.assertions(2);

          const permissionsGetter = new PermissionsGetter(defaultDependencies);
          jest.spyOn(permissionsGetter, '_retrievePermissions').mockImplementation();
          jest.spyOn(permissionsGetter, '_isRegularRetrievalRequired').mockImplementation().mockReturnValue(false);
          jest.spyOn(permissionsGetter, '_isRenderingOnlyRetrievalRequired').mockImplementation().mockReturnValue(true);

          const environmentId = 1000;
          permissionsGetter.getPermissions(1, 'Users', 'addEnabled', { environmentId });

          expect(permissionsGetter._retrievePermissions).toHaveBeenCalledTimes(1);
          expect(permissionsGetter._retrievePermissions)
            .toHaveBeenCalledWith(1, { environmentId, renderingOnly: true });
        });
      });
    });

    describe('when permissions are not expired', () => {
      it('should not call _retrievePermissions', () => {
        expect.assertions(1);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        jest.spyOn(permissionsGetter, '_retrievePermissions').mockImplementation();
        jest.spyOn(permissionsGetter, '_isRegularRetrievalRequired').mockImplementation().mockReturnValue(false);
        jest.spyOn(permissionsGetter, '_isRenderingOnlyRetrievalRequired').mockImplementation().mockReturnValue(false);

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter._retrievePermissions).not.toHaveBeenCalled();
      });
    });
  });

  describe('_retrievePermissions', () => {
    describe('when renderingOnly is false', () => {
      it('should call forestServerRequester with the right parameters', async () => {
        expect.assertions(2);

        const fakeResponse = {
          data: {},
          meta: {},
        };
        const mockForestServerRequesterPerform = jest.fn(async () => fakeResponse);
        const permissionsGetter = new PermissionsGetter({
          ...defaultDependencies,
          configStore: {
            lianaOptions: {
              envSecret: 'envSecret',
            },
          },
          forestServerRequester: {
            perform: mockForestServerRequesterPerform,
          },
        });

        await permissionsGetter._retrievePermissions(1);

        expect(mockForestServerRequesterPerform).toHaveBeenCalledTimes(1);
        expect(mockForestServerRequesterPerform).toHaveBeenCalledWith('/liana/v3/permissions', 'envSecret', { renderingId: 1 });
      });
    });

    describe('when renderingOnly is true', () => {
      it('should call forestServerRequester with renderingOnly true', async () => {
        expect.assertions(2);

        const fakeResponse = {
          data: {},
          meta: {},
        };
        const mockForestServerRequesterPerform = jest.fn(async () => fakeResponse);
        const permissionsGetter = new PermissionsGetter({
          ...defaultDependencies,
          configStore: {
            lianaOptions: {
              envSecret: 'envSecret',
            },
          },
          forestServerRequester: {
            perform: mockForestServerRequesterPerform,
          },
        });

        await permissionsGetter._retrievePermissions(1, { renderingOnly: true });

        expect(mockForestServerRequesterPerform).toHaveBeenCalledTimes(1);
        expect(mockForestServerRequesterPerform).toHaveBeenCalledWith('/liana/v3/permissions', 'envSecret', { renderingId: 1, renderingSpecificOnly: true });
      });
    });
  });
});
