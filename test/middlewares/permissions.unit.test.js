const PermissionMiddlewareCreator = require('../../src/middlewares/permissions');
const context = require('../../src/context');
const Schemas = require('../../src/generators/schemas');
const usersSchema = require('../fixtures/users-schema.js');

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

  describe('_getSmartActionInfoFromRequest', () => {
    describe('when no smart action can be found', () => {
      it('should throw an error', () => {
        expect.assertions(1);

        Schemas.schemas = { users: usersSchema };

        const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
          ...defaultDependencies,
        });

        const request = {
          user: { id: 1 }, baseUrl: '/forest', path: '/actions/test-me-unknown', method: 'POST',
        };
        const smartActionEndpoint = `${request.baseUrl}${request.path}`;
        const smartActionHTTPMethod = 'POST';
        const expectedErrorMessage = `Impossible to retrieve the smart action at endpoint ${smartActionEndpoint} and method ${smartActionHTTPMethod}`;

        expect(() => permissionMiddlewareCreator._getSmartActionInfoFromRequest(request))
          .toThrow(expectedErrorMessage);
      });
    });

    describe('when there is a matching smart action', () => {
      it('should return the userId and actionName', () => {
        expect.assertions(1);

        Schemas.schemas = { users: usersSchema };

        const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
          ...defaultDependencies,
        });
        const userId = 1;
        const request = {
          user: { id: userId }, baseUrl: '/forest', path: '/actions/test-me', method: 'POST',
        };

        const smartActionInfo = permissionMiddlewareCreator._getSmartActionInfoFromRequest(request);

        expect(smartActionInfo).toStrictEqual({ userId, actionName: 'Test me' });
      });
    });
  });
});
