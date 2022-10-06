const { init } = require('@forestadmin/context');
const httpError = require('http-errors');
const PermissionMiddlewareCreator = require('../../src/middlewares/permissions');

const Schemas = require('../../src/generators/schemas');

const buildRequest = (attributes) => ({
  query: { timezone: 'Europe/Paris' }, body: { data: { attributes } },
});

const http403 = httpError(403);

describe('middlewares > permissions', () => {
  const defaultDependencies = {
    modelsManager: {},
  };

  const createPermissionMiddlewareCreator = (collectionName, dependencies) => {
    const dependencyNames = Object.keys(dependencies);
    init((context) => dependencyNames.reduce((contextAccumulator, name) =>
      contextAccumulator.addInstance(name, () => dependencies[name]), context));
    return new PermissionMiddlewareCreator(collectionName);
  };

  describe('list', () => {
    it('should call canBrowse to ensure the user as the right permissions', async () => {
      expect.assertions(5);

      const collectionName = 'Sith';

      const authorizationService = {
        canBrowse: jest.fn().mockResolvedValue(),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .list()(request, null, next))
        .toResolve();

      expect(authorizationService.canBrowse).toHaveBeenCalledTimes(1);
      expect(authorizationService.canBrowse).toHaveBeenCalledWith(
        request.user,
        collectionName,
        null,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw HTTP error 403 on rejected canBrowse', async () => {
      expect.assertions(5);

      const collectionName = 'Sith';

      const authorizationService = {
        canBrowse: jest.fn().mockRejectedValue(new Error()),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 }, query: { segmentQuery: 'segmentQuery' } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .list()(request, null, next))
        .toResolve();

      expect(authorizationService.canBrowse).toHaveBeenCalledTimes(1);
      expect(authorizationService.canBrowse).toHaveBeenCalledWith(
        request.user,
        collectionName,
        'segmentQuery',
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(http403);
    });
  });

  describe('export', () => {
    it('should call canExport to ensure the user as the right permissions', async () => {
      expect.assertions(5);

      const collectionName = 'Sith';

      const authorizationService = {
        canExport: jest.fn().mockResolvedValue(),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .export()(request, null, next))
        .toResolve();

      expect(authorizationService.canExport).toHaveBeenCalledTimes(1);
      expect(authorizationService.canExport).toHaveBeenCalledWith(
        request.user,
        collectionName,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw HTTP error 403 on rejected canExport', async () => {
      expect.assertions(3);

      const collectionName = 'Sith';

      const authorizationService = {
        canExport: jest.fn().mockRejectedValue(new Error()),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .export()(request, null, next))
        .toResolve();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(http403);
    });
  });

  describe('details', () => {
    it('should call canRead to ensure the user as the right permissions', async () => {
      expect.assertions(5);

      const collectionName = 'Sith';

      const authorizationService = {
        canRead: jest.fn().mockResolvedValue(),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .details()(request, null, next))
        .toResolve();

      expect(authorizationService.canRead).toHaveBeenCalledTimes(1);
      expect(authorizationService.canRead).toHaveBeenCalledWith(
        request.user,
        collectionName,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw HTTP error 403 on rejected canRead', async () => {
      expect.assertions(3);

      const collectionName = 'Sith';

      const authorizationService = {
        canRead: jest.fn().mockRejectedValue(new Error()),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .details()(request, null, next))
        .toResolve();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(http403);
    });
  });

  describe('create', () => {
    it('should call canAdd to ensure the user as the right permissions', async () => {
      expect.assertions(5);

      const collectionName = 'Sith';

      const authorizationService = {
        canAdd: jest.fn().mockResolvedValue(),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .create()(request, null, next))
        .toResolve();

      expect(authorizationService.canAdd).toHaveBeenCalledTimes(1);
      expect(authorizationService.canAdd).toHaveBeenCalledWith(
        request.user,
        collectionName,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw HTTP error 403 on rejected canAdd', async () => {
      expect.assertions(3);

      const collectionName = 'Sith';

      const authorizationService = {
        canAdd: jest.fn().mockRejectedValue(new Error()),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .create()(request, null, next))
        .toResolve();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(http403);
    });
  });

  describe('update', () => {
    it('should call canEdit to ensure the user as the right permissions', async () => {
      expect.assertions(5);

      const collectionName = 'Sith';

      const authorizationService = {
        canEdit: jest.fn().mockResolvedValue(),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .update()(request, null, next))
        .toResolve();

      expect(authorizationService.canEdit).toHaveBeenCalledTimes(1);
      expect(authorizationService.canEdit).toHaveBeenCalledWith(
        request.user,
        collectionName,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw HTTP error 403 on rejected canBrowse', async () => {
      expect.assertions(3);

      const collectionName = 'Sith';

      const authorizationService = {
        canEdit: jest.fn().mockRejectedValue(new Error()),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .update()(request, null, next))
        .toResolve();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(http403);
    });
  });

  describe('delete', () => {
    it('should call canDelete to ensure the user as the right permissions', async () => {
      expect.assertions(5);

      const collectionName = 'Sith';

      const authorizationService = {
        canDelete: jest.fn().mockResolvedValue(),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .delete()(request, null, next))
        .toResolve();

      expect(authorizationService.canDelete).toHaveBeenCalledTimes(1);
      expect(authorizationService.canDelete).toHaveBeenCalledWith(
        request.user,
        collectionName,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw HTTP error 403 on rejected canDelete', async () => {
      expect.assertions(3);

      const collectionName = 'Sith';

      const authorizationService = {
        canDelete: jest.fn().mockRejectedValue(new Error()),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = { user: { renderingId: 20 } };
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .delete()(request, null, next))
        .toResolve();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(http403);
    });
  });

  describe('smartAction', () => {
    const defaultAttributes = {
      collection_name: 'users',
      values: {},
      ids: [],
      all_records: false,
      smart_action_id: 'users-action@@@bulk',
      attributesProp: 'attributesProp',
    };
    // eslint-disable-next-line jest/no-hooks
    beforeEach(() => {
      Schemas.schemas = {
        users: {
          name: 'users',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          actions: [{
            name: 'known-action',
          }],
        },
      };
    });

    it('should call canExecuteCustomActionAndReturnRequestBody to ensure the user as the right permissions', async () => {
      expect.assertions(6);

      const collectionName = 'users';

      const authorizationService = {
        canExecuteCustomActionAndReturnRequestBody: jest.fn().mockResolvedValue(),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = buildRequest(defaultAttributes);
      request.baseUrl = '/forest';
      request.path = '/actions/known-action';
      request.method = 'POST';

      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .smartAction()[0](request, null, next))
        .toResolve();

      expect(authorizationService.canExecuteCustomActionAndReturnRequestBody)
        .toHaveBeenCalledTimes(1);
      expect(authorizationService.canExecuteCustomActionAndReturnRequestBody).toHaveBeenCalledWith(
        request,
        'known-action',
        collectionName,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();

      expect(request.body.data.attributes.attributesProp).toBe('attributesProp');
    });

    it('should throw HTTP error 403 on rejected canExecuteCustomActionAndReturnRequestBody', async () => {
      expect.assertions(4);

      const collectionName = 'Sith';

      const authorizationService = {
        canExecuteCustomActionAndReturnRequestBody: jest.fn().mockRejectedValue(new Error()),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = buildRequest(defaultAttributes);
      request.baseUrl = '/forest';
      request.path = '/actions/unknown-action';
      request.method = 'POST';
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .smartAction()[0](request, null, next))
        .toResolve();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(http403);

      expect(request.body.data.attributes.attributesProp).toBe('attributesProp');
    });

    it('should throw HTTP error 403 on unknown action', async () => {
      expect.assertions(4);

      const collectionName = 'Sith';

      const authorizationService = {
        canExecuteCustomActionAndReturnRequestBody: jest.fn().mockResolvedValue(),
      };

      const permissionMiddlewareCreator = createPermissionMiddlewareCreator(collectionName, {
        ...defaultDependencies,
        authorizationService,
      });

      const request = buildRequest(defaultAttributes);
      request.baseUrl = '/forest';
      request.path = '/actions/unknown-action';
      request.method = 'POST';
      const next = jest.fn();

      await expect(permissionMiddlewareCreator
        .smartAction()[0](request, null, next))
        .toResolve();

      expect(authorizationService.canExecuteCustomActionAndReturnRequestBody)
        .not.toHaveBeenCalled();

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(http403);
    });
  });
});
