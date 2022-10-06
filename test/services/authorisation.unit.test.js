/* eslint-disable jest/prefer-expect-assertions */
import AuthorizationService from '../../src/services/authorization';

describe('unit > services > AuthorizationService', () => {
  const user = {
    id: 16,
    renderingId: 42,
    email: 'user@email.com',
    tags: {},
  };

  function makeContext() {
    return {
      forestAdminClient: {
        canBrowse: jest.fn(),
        canOnCollection: jest.fn(),
        canExecuteCustomAction: jest.fn(),
        canRetrieveChart: jest.fn(),
      },
    };
  }

  describe('canBrowse', () => {
    it('should not throw when the user can browse a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canBrowse.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canBrowse(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.canBrowse).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.canBrowse).toHaveBeenCalledWith({
        userId: user.id,
        collectionName: 'collectionName',
        renderingId: user.renderingId,
        segmentQuery: undefined,
      });
    });

    it('should throw when the user cannot browse a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canBrowse.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canBrowse(
        user,
        'collectionName',
        'segmentQuery',
      )).rejects.toThrow('Forbidden - User user@email.com is not authorize to browse on collection collectionName');

      expect(forestAdminClient.canBrowse).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.canBrowse).toHaveBeenCalledWith({
        userId: user.id,
        collectionName: 'collectionName',
        renderingId: user.renderingId,
        segmentQuery: 'segmentQuery',
      });
    });
  });

  describe('canRead', () => {
    it('should not throw when the user can browse a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canRead(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'read',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot browse a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canRead(
        user,
        'collectionName',
      )).rejects.toThrow('Forbidden - User user@email.com is not authorize to read on collection collectionName');
    });
  });

  describe('canAdd', () => {
    it('should not throw when the user can read a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canAdd(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'add',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot read a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canAdd(
        user,
        'collectionName',
      )).rejects.toThrow('Forbidden - User user@email.com is not authorize to add on collection collectionName');
    });
  });

  describe('canEdit', () => {
    it('should not throw when the user can edit a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canEdit(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'edit',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot edit a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canEdit(
        user,
        'collectionName',
      )).rejects.toThrow('Forbidden - User user@email.com is not authorize to edit on collection collectionName');
    });
  });

  describe('canDelete', () => {
    it('should not throw when the user can delete a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canDelete(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'delete',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot delete a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canDelete(
        user,
        'collectionName',
      )).rejects.toThrow('Forbidden - User user@email.com is not authorize to delete on collection collectionName');
    });
  });

  describe('canExport', () => {
    it('should not throw when the user can export a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canExport(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'export',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot export a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(context);

      await expect(authorizationService.canExport(
        user,
        'collectionName',
      )).rejects.toThrow('Forbidden - User user@email.com is not authorize to export on collection collectionName');
    });
  });

  describe('canExecuteCustomActionAndReturnRequestBody', () => {
    it('should return the body if the user is authorized', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);

      const request = {
        body: {
          data: {
            attributes: {},
          },
        },
        user: {
          id: 35,
          renderingId: 42,
        },
      };

      forestAdminClient.canExecuteCustomAction.mockResolvedValue({ new: 'body' });

      const result = await authorizationService.canExecuteCustomActionAndReturnRequestBody(
        request,
        'custom-action',
        'books',
      );

      expect(result).toStrictEqual({ new: 'body' });

      expect(forestAdminClient.canExecuteCustomAction).toHaveBeenCalledWith({
        userId: 35,
        customActionName: 'custom-action',
        collectionName: 'books',
        body: request.body,
      });
    });

    it('should throw an error if the user is not authorized', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);

      const request = {
        body: {
          data: {
            attributes: {},
          },
        },
        user: {
          id: 35,
          renderingId: 42,
        },
      };

      forestAdminClient.canExecuteCustomAction.mockResolvedValue(false);

      await expect(authorizationService.canExecuteCustomActionAndReturnRequestBody(
        request,
        'custom-action',
        'books',
      )).rejects.toThrow('Forbidden - User is not authorize Smart Action');
    });
  });

  describe('canRetrieveChart', () => {
    it('should check if the user can retrieve the chart and do nothing if OK', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);
      const request = {
        user: {
          id: 35,
          renderingId: 42,
        },
        body: { foo: 'bar' },
      };

      forestAdminClient.canRetrieveChart.mockResolvedValue(true);

      await expect(authorizationService.canRetrieveChart(request)).toResolve();

      expect(forestAdminClient.canRetrieveChart).toHaveBeenCalledWith({
        renderingId: 42,
        userId: 35,
        chartRequest: { foo: 'bar' },
      });
    });

    it('should throw an error if the user cannot retrieve the chart', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(context);
      const request = {
        user: {
          id: 35,
          renderingId: 42,
        },
        body: { foo: 'bar' },
      };

      forestAdminClient.canRetrieveChart.mockResolvedValue(false);

      await expect(authorizationService.canRetrieveChart(request)).rejects.toThrow('Forbidden - User is not authorize view this chart');
    });
  });
});
