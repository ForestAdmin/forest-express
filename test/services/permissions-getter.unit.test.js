const moment = require('moment');
const VError = require('verror');
const Sinon = require('sinon');
const PermissionsGetter = require('../../src/services/permissions-getter');

describe('services > PermissionsGetter', () => {
  const defaultDependencies = {
    env: {},
    configStore: {},
    forestServerRequester: {},
    moment,
    VError,
  };

  describe('_setRenderingPermissions', () => {
    it('should set the permissions', () => {
      expect.assertions(4);

      const permissions = 'superPermissions';
      const permissionsGetter = new PermissionsGetter(defaultDependencies);
      permissionsGetter._setRenderingPermissions(1, permissions);
      expect(permissionsGetter.permissions.renderings).toBeObject();
      expect(permissionsGetter.permissions.renderings[1]).toBeObject();
      expect(permissionsGetter.permissions.renderings[1].data).toStrictEqual(permissions);
      expect(new Date(permissionsGetter.permissions.renderings[1].lastRetrieve)).toBeValidDate();
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
  });

  describe('_setRolesACLPermissions', () => {
    it('should set the permissions', () => {
      expect.assertions(2);

      const permissions = {
        collections: 'collectionsPermissions',
        renderings: {
          1: 'renderingPermissions',
        },
      };

      const permissionsGetter = new PermissionsGetter(defaultDependencies);

      const setRenderingPermissionsSpy = Sinon.spy(permissionsGetter, '_setRenderingPermissions');
      const setCollectionsPermissionsSpy = Sinon.spy(permissionsGetter, '_setCollectionsPermissions');

      permissionsGetter._setRolesACLPermissions(1, permissions);
      expect(setRenderingPermissionsSpy.calledOnceWith(1, 'renderingPermissions')).toBeTrue();
      expect(setCollectionsPermissionsSpy.calledOnceWith('collectionsPermissions')).toBeTrue();

      setRenderingPermissionsSpy.restore();
      setCollectionsPermissionsSpy.restore();
    });
  });

  describe('_setPermissions', () => {
    describe('when isRolesACLActivated is true', () => {
      it('should set the permissions', () => {
        expect.assertions(2);

        const permissions = {
          collections: 'collectionsPermissions',
          renderings: {
            1: 'renderingPermissions',
          },
        };

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        permissionsGetter.isRolesACLActivated = true;

        const setRolesACLPermissionsSpy = Sinon.spy(permissionsGetter, '_setRolesACLPermissions');
        const transformPermissionsFromOldToNewFormatSpy = Sinon.spy(PermissionsGetter, '_transformPermissionsFromOldToNewFormat');

        permissionsGetter._setPermissions(1, permissions);
        expect(setRolesACLPermissionsSpy.calledOnceWith(1, permissions)).toBeTrue();
        expect(transformPermissionsFromOldToNewFormatSpy.notCalled).toBeTrue();

        setRolesACLPermissionsSpy.restore();
        transformPermissionsFromOldToNewFormatSpy.restore();
      });
    });

    describe('when isRolesACLActivated is false', () => {
      it('should set the permissions', () => {
        expect.assertions(3);

        const permissions = {};

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        permissionsGetter.isRolesACLActivated = false;
        const setRenderingPermissionsSpy = Sinon.spy(permissionsGetter, '_setRenderingPermissions');
        const setCollectionsPermissionsSpy = Sinon.spy(permissionsGetter, '_setCollectionsPermissions');
        const transformPermissionsFromOldToNewFormatSpy = Sinon.spy(PermissionsGetter, '_transformPermissionsFromOldToNewFormat');

        permissionsGetter._setPermissions(1, permissions);
        expect(setRenderingPermissionsSpy.calledOnceWith(1, permissions)).toBeTrue();
        expect(setCollectionsPermissionsSpy.notCalled).toBeTrue();
        expect(transformPermissionsFromOldToNewFormatSpy.calledOnceWith(permissions)).toBeTrue();

        setRenderingPermissionsSpy.restore();
        setCollectionsPermissionsSpy.restore();
        transformPermissionsFromOldToNewFormatSpy.restore();
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
        expect.assertions(1);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        Sinon.replace(permissionsGetter, '_retrievePermissions', Sinon.fake());

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled', { forceRetrieve: true });

        expect(permissionsGetter._retrievePermissions.calledOnceWithExactly(1)).toBeTrue();

        Sinon.restore();
      });
    });

    describe('when global permissions are expired', () => {
      it('should call _retrievePermissions', () => {
        expect.assertions(1);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        Sinon.replace(permissionsGetter, '_retrievePermissions', Sinon.fake());
        Sinon.replace(permissionsGetter, '_isRegularRetrievalRequired', Sinon.fake.returns(true));

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter._retrievePermissions.calledOnceWithExactly(1)).toBeTrue();

        Sinon.restore();
      });
    });

    describe('when rendering permissions are expired', () => {
      it('should call _retrievePermissions with renderingOnly true', () => {
        expect.assertions(1);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        Sinon.replace(permissionsGetter, '_retrievePermissions', Sinon.fake());
        Sinon.replace(permissionsGetter, '_isRegularRetrievalRequired', Sinon.fake.returns(false));
        Sinon.replace(permissionsGetter, '_isRenderingOnlyRetrievalRequired', Sinon.fake.returns(true));

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter
          ._retrievePermissions.calledOnceWithExactly(1, { renderingOnly: true })).toBeTrue();

        Sinon.restore();
      });
    });

    describe('when permissions are not expired', () => {
      it('should not call _retrievePermissions', () => {
        expect.assertions(1);

        const permissionsGetter = new PermissionsGetter(defaultDependencies);
        Sinon.replace(permissionsGetter, '_retrievePermissions', Sinon.fake());
        Sinon.replace(permissionsGetter, '_isRegularRetrievalRequired', Sinon.fake.returns(false));
        Sinon.replace(permissionsGetter, '_isRenderingOnlyRetrievalRequired', Sinon.fake.returns(false));

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter._retrievePermissions.notCalled).toBeTrue();

        Sinon.restore();
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
