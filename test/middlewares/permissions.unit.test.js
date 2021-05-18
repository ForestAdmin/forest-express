const PermissionMiddlewareCreator = require('../../src/middlewares/permissions');
const context = require('../../src/context');
const Schemas = require('../../src/generators/schemas');
const usersSchema = require('../fixtures/users-schema.js');

const buildRequest = (attributes) => ({
  query: { timezone: 'Europe/Paris' }, body: { data: { attributes } },
});

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

  describe('_ensureRecordIdsInScope', () => {
    it('should return a middleware', () => {
      expect.assertions(1);

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
        ...defaultDependencies,
      });
      const middleware = permissionMiddlewareCreator._ensureRecordIdsInScope({});
      expect(typeof middleware).toStrictEqual('function');
    });

    describe('when calling the generated middleware', () => {
      const model = { name: 'users' };
      const defaultResponse = {};
      const defaultAttributes = {
        collection_name: 'users',
        values: {},
        ids: [],
        all_records: false,
        smart_action_id: 'users-action@@@bulk',
      };

      Schemas.schemas = { users: usersSchema };

      describe('when asking for all records', () => {
        it('should call next without other checks', async () => {
          expect.assertions(2);

          const request = buildRequest({ ...defaultAttributes, all_records: true });
          const next = jest.fn();

          const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
            ...defaultDependencies,
          });
          const middleware = permissionMiddlewareCreator._ensureRecordIdsInScope(model);
          await middleware(request, defaultResponse, next);

          expect(next).toHaveBeenCalledTimes(1);
          expect(next).toHaveBeenCalledWith();
        });
      });

      describe('on a model with composite primary keys', () => {
        it('should call next without other checks', async () => {
          expect.assertions(4);

          Schemas.schemas.users.idField = 'forestCompositePrimary';
          Schemas.schemas.users.isCompositePrimary = true;

          const request = buildRequest({ ...defaultAttributes });
          const next = jest.fn();

          const configStore = {
            Implementation: {
              getModelName: jest.fn().mockReturnValue('users'),
            },
          };
          const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
            ...defaultDependencies,
            configStore,
          });
          const middleware = permissionMiddlewareCreator._ensureRecordIdsInScope(model);
          await middleware(request, defaultResponse, next);

          expect(configStore.Implementation.getModelName).toHaveBeenCalledTimes(1);
          expect(configStore.Implementation.getModelName).toHaveBeenCalledWith(model);
          expect(next).toHaveBeenCalledTimes(1);
          expect(next).toHaveBeenCalledWith();

          Schemas.schemas.users.idField = 'id';
          Schemas.schemas.users.isCompositePrimary = false;
        });
      });

      describe('when some ids don\'t match the registered scope', () => {
        it('should send a 400 http response', async () => {
          expect.assertions(7);

          const request = buildRequest({ ...defaultAttributes, ids: ['1', '2'] });
          const next = jest.fn();
          const statusReturnValue = { send: jest.fn() };
          const response = { status: jest.fn().mockReturnValue(statusReturnValue) };

          const configStore = {
            Implementation: {
              getModelName: jest.fn().mockReturnValue('users'),
              ResourcesGetter: jest.fn().mockImplementation(() => ({ count: () => 3 })),
            },
          };
          const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
            ...defaultDependencies,
            configStore,
          });
          const middleware = permissionMiddlewareCreator._ensureRecordIdsInScope(model);
          await middleware(request, response, next);

          expect(configStore.Implementation.getModelName).toHaveBeenCalledTimes(1);
          expect(configStore.Implementation.getModelName).toHaveBeenCalledWith(model);
          expect(response.status).toHaveBeenCalledTimes(1);
          expect(response.status).toHaveBeenCalledWith(400);
          expect(statusReturnValue.send).toHaveBeenCalledTimes(1);
          expect(statusReturnValue.send).toHaveBeenCalledWith({
            error: 'Smart Action: target records are out of scope',
          });
          expect(next).not.toHaveBeenCalled();
        });
      });

      describe('all provided ids are within the registered scope', () => {
        it('should call next without other checks', async () => {
          expect.assertions(5);

          const request = buildRequest({ ...defaultAttributes, ids: ['1', '2', '3'] });
          const next = jest.fn();
          const response = { status: jest.fn() };

          const configStore = {
            Implementation: {
              getModelName: jest.fn().mockReturnValue('users'),
              ResourcesGetter: jest.fn().mockImplementation(() => ({ count: () => 3 })),
            },
          };
          const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
            ...defaultDependencies,
            configStore,
          });
          const middleware = permissionMiddlewareCreator._ensureRecordIdsInScope(model);
          await middleware(request, response, next);

          expect(configStore.Implementation.getModelName).toHaveBeenCalledTimes(1);
          expect(configStore.Implementation.getModelName).toHaveBeenCalledWith(model);
          expect(response.status).not.toHaveBeenCalled();
          expect(next).toHaveBeenCalledTimes(1);
          expect(next).toHaveBeenCalledWith();
        });
      });
    });
  });

  describe('smartAction', () => {
    describe('when no model is provided', () => {
      it('should raise an error', () => {
        expect.assertions(1);

        const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
          ...defaultDependencies,
        });

        expect(() => permissionMiddlewareCreator.smartAction())
          .toThrow('missing model in the smartAction middleware definition');
      });
    });

    describe('when a valid model is provided', () => {
      it('should generate an array of middlewares', () => {
        expect.assertions(3);

        const permissionMiddlewareCreator = createPermissionMiddlewareCreator('users', {
          ...defaultDependencies,
        });

        const smartActionPermissionMiddlewares = permissionMiddlewareCreator
          .smartAction({ name: 'users' });

        expect(smartActionPermissionMiddlewares).toHaveLength(2);
        expect(typeof smartActionPermissionMiddlewares[0]).toStrictEqual('function');
        expect(typeof smartActionPermissionMiddlewares[1]).toStrictEqual('function');
      });
    });
  });
});
