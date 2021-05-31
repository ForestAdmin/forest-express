const PermissionMiddlewareCreator = require('../../src/middlewares/permissions');
const context = require('../../src/context');

describe('middlewares > permissions', () => {
  const defaultDependencies = {
    logger: {},
    permissionsChecker: {},
    configStore: {},
  };

  const createPermissionMiddlewareCreator = (collectionName, dependencies) => {
    jest.spyOn(context, 'inject').mockReturnValue(dependencies);
    return new PermissionMiddlewareCreator(collectionName);
  };

  describe('_checkPermissions', () => {
    describe('with no options multiplePermissionsCache', () => {
      it('should call ensure the user as the right permissions', async () => {
        expect.assertions(7);

        const permissionName = 'browseEnabled';
        const collectionName = 'Sith';
        const permissionsChecker = {
          checkPermissions: jest.fn().mockReturnValue(),
        };
        const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
          ...defaultDependencies,
          configStore: {
            lianaOptions: {},
          },
          permissionsChecker,
        });
        const permissionInfos = 'permissionsInfos';
        jest.spyOn(permissionMiddlewareCreator, '_getPermissionsInfo').mockReturnValue(permissionInfos);

        const renderingId = 11;
        const request = { user: { renderingId } };
        const next = jest.fn();

        await expect(permissionMiddlewareCreator
          ._checkPermission(permissionName)(request, null, next))
          .toResolve();

        expect(permissionMiddlewareCreator._getPermissionsInfo).toHaveBeenCalledTimes(1);
        expect(permissionMiddlewareCreator._getPermissionsInfo)
          .toHaveBeenCalledWith(permissionName, request);

        expect(permissionsChecker.checkPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsChecker.checkPermissions)
          .toHaveBeenCalledWith(renderingId, collectionName, permissionName, permissionInfos, null);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });
    });

    describe('with multiplePermissionsCache options', () => {
      it('should call ensure the user as the right permissions', async () => {
        expect.assertions(9);

        const permissionName = 'browseEnabled';
        const collectionName = 'Sith';
        const environmentId = 66;
        const permissionsChecker = {
          checkPermissions: jest.fn().mockReturnValue(),
        };
        const configStore = {
          lianaOptions: {
            multiplePermissionsCache: {
              getEnvironmentId: jest.fn().mockReturnValue(environmentId),
            },
          },
        };
        const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
          ...defaultDependencies,
          configStore,
          permissionsChecker,
        });
        const permissionInfos = 'permissionsInfos';
        jest.spyOn(permissionMiddlewareCreator, '_getPermissionsInfo').mockReturnValue(permissionInfos);

        const renderingId = 11;
        const request = { user: { renderingId } };
        const next = jest.fn();

        await expect(permissionMiddlewareCreator
          ._checkPermission(permissionName)(request, null, next))
          .toResolve();

        expect(permissionMiddlewareCreator._getPermissionsInfo).toHaveBeenCalledTimes(1);
        expect(permissionMiddlewareCreator._getPermissionsInfo)
          .toHaveBeenCalledWith(permissionName, request);

        expect(configStore.lianaOptions.multiplePermissionsCache.getEnvironmentId)
          .toHaveBeenCalledTimes(1);
        expect(configStore.lianaOptions.multiplePermissionsCache.getEnvironmentId)
          .toHaveBeenCalledWith(request);

        expect(permissionsChecker.checkPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsChecker.checkPermissions)
          .toHaveBeenCalledWith(
            renderingId, collectionName, permissionName, permissionInfos, environmentId,
          );

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });
    });
  });

  describe('_getStatWithParametersInfoFromRequest', () => {
    describe('with group_by_field informations - collection:field', () => {
      it('should remove the field from group_by_field and return the right parameters', async () => {
        expect.assertions(1);

        const request = {
          body: { aggregate: 'Count', collection: 'collection', group_by_field: 'otherCollection:id' },
          notTheBody: {},
        };

        const parameters = PermissionMiddlewareCreator
          ._getStatWithParametersInfoFromRequest(request);

        expect(parameters).toStrictEqual({ aggregate: 'Count', collection: 'collection', group_by_field: 'otherCollection' });
      });
    });

    describe('with group_by_field informations - collection only', () => {
      it('should return the right parameters', async () => {
        expect.assertions(1);

        const request = {
          body: { aggregate: 'Count', collection: 'collection', group_by_field: 'otherCollection' },
          notTheBody: {},
        };

        const parameters = PermissionMiddlewareCreator
          ._getStatWithParametersInfoFromRequest(request);

        expect(parameters).toStrictEqual({ aggregate: 'Count', collection: 'collection', group_by_field: 'otherCollection' });
      });
    });

    describe('without group_by_field informations', () => {
      it('should return the right parameters', async () => {
        expect.assertions(1);

        const request = {
          body: { aggregate: 'Count', collection: 'collection', type: 'Pie' },
          notTheBody: {},
        };

        const parameters = PermissionMiddlewareCreator
          ._getStatWithParametersInfoFromRequest(request);

        expect(parameters).toStrictEqual({ aggregate: 'Count', collection: 'collection', type: 'Pie' });
      });
    });
  });
});
