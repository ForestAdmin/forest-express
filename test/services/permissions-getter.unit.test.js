const moment = require('moment');
const Sinon = require('sinon');
const PermissionsGetter = require('../../src/services/permissions-getter');
const forestServerRequester = require('../../src/services/forest-server-requester');

describe('services > PermissionsGetter', () => {
  describe('_setRenderingPermissions', () => {
    it('should set the permissions', () => {
      expect.assertions(4);
      PermissionsGetter.cleanCache();

      const permissions = 'superPermissions';
      PermissionsGetter._setRenderingPermissions(1, permissions);
      expect(PermissionsGetter.permissions.renderings).toBeObject();
      expect(PermissionsGetter.permissions.renderings[1]).toBeObject();
      expect(PermissionsGetter.permissions.renderings[1].data).toStrictEqual(permissions);
      expect(new Date(PermissionsGetter.permissions.renderings[1].lastRetrieve)).toBeValidDate();
    });
  });

  describe('_setCollectionsPermissions', () => {
    it('should set the permissions', () => {
      expect.assertions(3);
      PermissionsGetter.cleanCache();

      const permissions = 'superPermissions';
      PermissionsGetter._setCollectionsPermissions(permissions);
      expect(PermissionsGetter.permissions.collections).toBeObject();
      expect(PermissionsGetter.permissions.collections.data).toStrictEqual(permissions);
      expect(new Date(PermissionsGetter.permissions.collections.lastRetrieve)).toBeValidDate();
    });
  });

  describe('_setPermissions', () => {
    describe('when isRolesACLActivated is true', () => {
      it('should set the permissions', () => {
        expect.assertions(3);
        PermissionsGetter.cleanCache();

        PermissionsGetter.isRolesACLActivated = true;
        const permissions = {
          collections: 'collectionsPermissions',
          renderings: {
            1: 'renderingPermissions',
          },
        };

        const setRenderingPermissionsSpy = Sinon.spy(PermissionsGetter, '_setRenderingPermissions');
        const setCollectionsPermissionsSpy = Sinon.spy(PermissionsGetter, '_setCollectionsPermissions');
        const transformPermissionsFromOldToNewFormatSpy = Sinon.spy(PermissionsGetter, '_transformPermissionsFromOldToNewFormat');

        PermissionsGetter._setPermissions(1, permissions);
        expect(setRenderingPermissionsSpy.calledOnceWith(1, 'renderingPermissions')).toBeTrue();
        expect(setCollectionsPermissionsSpy.calledOnceWith('collectionsPermissions')).toBeTrue();
        expect(transformPermissionsFromOldToNewFormatSpy.notCalled).toBeTrue();

        setRenderingPermissionsSpy.restore();
        setCollectionsPermissionsSpy.restore();
        transformPermissionsFromOldToNewFormatSpy.restore();
      });
    });

    describe('when isRolesACLActivated is false', () => {
      it('should set the permissions', () => {
        expect.assertions(3);
        PermissionsGetter.cleanCache();

        PermissionsGetter.isRolesACLActivated = false;
        const permissions = {};

        const setRenderingPermissionsSpy = Sinon.spy(PermissionsGetter, '_setRenderingPermissions');
        const setCollectionsPermissionsSpy = Sinon.spy(PermissionsGetter, '_setCollectionsPermissions');
        const transformPermissionsFromOldToNewFormatSpy = Sinon.spy(PermissionsGetter, '_transformPermissionsFromOldToNewFormat');

        PermissionsGetter._setPermissions(1, permissions);
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
          PermissionsGetter.cleanCache();
          PermissionsGetter.isRolesACLActivated = true;
          PermissionsGetter.permissions = {
            collections: {
              lastRetrieve: moment('1998-07-15'),
            },
            renderings: {
              1: {
                lastRetrieve: moment(),
              },
            },
          };

          expect(PermissionsGetter._isRegularRetrievalRequired(1)).toBeTrue();
        });
      });

      describe('when permissions are not expired', () => {
        it('should return false', () => {
          expect.assertions(1);
          PermissionsGetter.cleanCache();
          PermissionsGetter.isRolesACLActivated = true;
          PermissionsGetter.permissions = {
            collections: {
              lastRetrieve: moment(),
            },
            renderings: {
              1: {
                lastRetrieve: moment('1998-07-15'),
              },
            },
          };

          expect(PermissionsGetter._isRegularRetrievalRequired(1)).toBeFalse();
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
            PermissionsGetter.cleanCache();
            PermissionsGetter.isRolesACLActivated = true;

            expect(PermissionsGetter._isRenderingOnlyRetrievalRequired(1, permissionName))
              .toBeFalse();
          });
        });
      });
      describe('when called with browseEnabled', () => {
        describe('when permissions are expired', () => {
          it('should return true', () => {
            expect.assertions(1);
            PermissionsGetter.cleanCache();
            PermissionsGetter.isRolesACLActivated = true;

            expect(PermissionsGetter._isRenderingOnlyRetrievalRequired(1, 'browseEnabled')).toBeTrue();
          });
        });

        describe('when permissions are not expired', () => {
          it('should return true', () => {
            expect.assertions(1);
            PermissionsGetter.cleanCache();
            PermissionsGetter.isRolesACLActivated = true;

            PermissionsGetter.permissions = {
              renderings: {
                1: {
                  lastRetrieve: moment(),
                },
              },
            };

            expect(PermissionsGetter._isRenderingOnlyRetrievalRequired(1, 'browseEnabled')).toBeFalse();
          });
        });
      });
    });

    describe('when isRolesACLActivated is false', () => {
      it('should return false', () => {
        expect.assertions(1);
        PermissionsGetter.cleanCache();
        PermissionsGetter.isRolesACLActivated = false;

        expect(PermissionsGetter._isRenderingOnlyRetrievalRequired(1, 'browseEnabled')).toBeFalse();
      });
    });
  });

  describe('getPermissions', () => {
    describe('with forceRetrieve true', () => {
      it('should call _retrievePermissions', () => {
        expect.assertions(1);
        PermissionsGetter.cleanCache();

        const permissionsGetter = new PermissionsGetter('envSecret');
        Sinon.replace(permissionsGetter, '_retrievePermissions', Sinon.fake());

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled', { forceRetrieve: true });

        expect(permissionsGetter._retrievePermissions.calledOnceWithExactly(1)).toBeTrue();

        Sinon.restore();
      });
    });

    describe('when global permissions are expired', () => {
      it('should call _retrievePermissions', () => {
        expect.assertions(1);
        PermissionsGetter.cleanCache();

        const permissionsGetter = new PermissionsGetter('envSecret');
        Sinon.replace(permissionsGetter, '_retrievePermissions', Sinon.fake());
        Sinon.replace(PermissionsGetter, '_isRegularRetrievalRequired', Sinon.fake.returns(true));

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter._retrievePermissions.calledOnceWithExactly(1)).toBeTrue();

        Sinon.restore();
      });
    });

    describe('when rendering permissions are expired', () => {
      it('should call _retrievePermissions with renderingOnly true', () => {
        expect.assertions(1);
        PermissionsGetter.cleanCache();

        const permissionsGetter = new PermissionsGetter('envSecret');
        Sinon.replace(permissionsGetter, '_retrievePermissions', Sinon.fake());
        Sinon.replace(PermissionsGetter, '_isRegularRetrievalRequired', Sinon.fake.returns(false));
        Sinon.replace(PermissionsGetter, '_isRenderingOnlyRetrievalRequired', Sinon.fake.returns(true));

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter
          ._retrievePermissions.calledOnceWithExactly(1, { renderingOnly: true })).toBeTrue();

        Sinon.restore();
      });
    });

    describe('when permissions are not expired', () => {
      it('should not call _retrievePermissions', () => {
        expect.assertions(1);
        PermissionsGetter.cleanCache();

        const permissionsGetter = new PermissionsGetter('envSecret');
        Sinon.replace(permissionsGetter, '_retrievePermissions', Sinon.fake());
        Sinon.replace(PermissionsGetter, '_isRegularRetrievalRequired', Sinon.fake.returns(false));
        Sinon.replace(PermissionsGetter, '_isRenderingOnlyRetrievalRequired', Sinon.fake.returns(false));

        permissionsGetter.getPermissions(1, 'Users', 'addEnabled');

        expect(permissionsGetter._retrievePermissions.notCalled).toBeTrue();

        Sinon.restore();
      });
    });
  });

  describe('_retrievePermissions', () => {
    describe('when renderingOnly is false', () => {
      it('should call forestServerRequester with the right parameters', () => {
        expect.assertions(1);
        PermissionsGetter.cleanCache();

        const permissionsGetter = new PermissionsGetter('envSecret');
        const fakeResponse = {
          data: {},
          meta: {},
        };
        Sinon.replace(forestServerRequester, 'perform', Sinon.fake.returns(fakeResponse));

        permissionsGetter._retrievePermissions(1);

        expect(forestServerRequester.perform.calledOnceWith('/liana/v3/permissions', 'envSecret', { renderingId: 1 })).toBeTrue();

        Sinon.restore();
      });
    });

    describe('when renderingOnly is true', () => {
      it('should call forestServerRequester with renderingOnly true', () => {
        expect.assertions(1);
        PermissionsGetter.cleanCache();

        const permissionsGetter = new PermissionsGetter('envSecret');
        const fakeResponse = {
          data: {},
          meta: {},
        };
        Sinon.replace(forestServerRequester, 'perform', Sinon.fake.returns(fakeResponse));

        permissionsGetter._retrievePermissions(1, { renderingOnly: true });

        expect(forestServerRequester.perform
          .calledOnceWith('/liana/v3/permissions', 'envSecret', { renderingId: 1, renderingSpecificOnly: true }))
          .toBeTrue();

        Sinon.restore();
      });
    });
  });
});
