/* eslint-disable jest/prefer-expect-assertions */
import { ChartType, CollectionActionEvent } from '@forestadmin/forestadmin-client';
import AuthorizationService from '../../src/services/authorization';
import ForbiddenError from '../../src/utils/errors/forbidden-error';

describe('unit > services > AuthorizationService', () => {
  const user = {
    id: 16,
    renderingId: 42,
    email: 'user@email.com',
    tags: {},
  };

  function makeContext() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      forestAdminClient: {
        permissionService: {
          canOnCollection: jest.fn(),
          canExecuteCustomAction: jest.fn(),
          canExecuteChart: jest.fn(),
          canExecuteSegmentQuery: jest.fn(),
          canApproveCustomAction: jest.fn(),
          canTriggerCustomAction: jest.fn(),
        },
        verifySignedActionParameters: jest.fn(),
      },
    };
  }

  describe('assertCanBrowse', () => {
    it('should not throw when the user can browse a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanBrowse(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        collectionName: 'collectionName',
        event: CollectionActionEvent.Browse,
      });
    });

    it('should throw when the user cannot browse a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(false);
      forestAdminClient.permissionService.canExecuteSegmentQuery.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanBrowse(
        user,
        'collectionName',
        'segmentQuery',
      )).rejects.toThrow(ForbiddenError);

      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        collectionName: 'collectionName',
        event: CollectionActionEvent.Browse,
      });
    });

    it('should throw when the user cannot execute a segment query', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);
      forestAdminClient.permissionService.canExecuteSegmentQuery.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanBrowse(
        user,
        'collectionName',
        'segmentQuery',
      )).rejects.toThrow(ForbiddenError);

      expect(forestAdminClient.permissionService.canExecuteSegmentQuery).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canExecuteSegmentQuery).toHaveBeenCalledWith({
        userId: user.id,
        collectionName: 'collectionName',
        renderingId: user.renderingId,
        segmentQuery: 'segmentQuery',
      });
    });
  });

  describe('assertCanRead', () => {
    it('should not throw when the user can browse a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanRead(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'read',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot browse a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanRead(
        user,
        'collectionName',
      )).rejects.toThrow(ForbiddenError);
    });
  });

  describe('assertCanAdd', () => {
    it('should not throw when the user can read a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanAdd(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'add',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot read a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanAdd(
        user,
        'collectionName',
      )).rejects.toThrow(ForbiddenError);
    });
  });

  describe('assertCanEdit', () => {
    it('should not throw when the user can edit a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanEdit(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'edit',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot edit a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanEdit(
        user,
        'collectionName',
      )).rejects.toThrow(ForbiddenError);
    });
  });

  describe('assertCanDelete', () => {
    it('should not throw when the user can delete a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanDelete(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'delete',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot delete a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanDelete(
        user,
        'collectionName',
      )).rejects.toThrow(ForbiddenError);
    });
  });

  describe('assertCanExport', () => {
    it('should not throw when the user can export a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanExport(
        user,
        'collectionName',
      )).toResolve();

      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canOnCollection).toHaveBeenCalledWith({
        userId: user.id,
        event: 'export',
        collectionName: 'collectionName',
      });
    });

    it('should throw when the user cannot export a collection', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanExport(
        user,
        'collectionName',
      )).rejects.toThrow(ForbiddenError);
    });
  });

  describe('assertCanRetrieveChart', () => {
    it('should check if the user can retrieve the chart and do nothing if OK', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      forestAdminClient.permissionService.canExecuteChart.mockResolvedValue(true);

      await expect(authorizationService.assertCanRetrieveChart({
        chartRequest: {
          type: ChartType.Value,
          sourceCollectionName: 'jedi',
          aggregateFieldName: 'strength',
          aggregator: 'Sum',
        },
        user,
      })).toResolve();

      expect(forestAdminClient.permissionService.canExecuteChart).toHaveBeenCalledWith({
        renderingId: user.renderingId,
        userId: user.id,
        chartRequest: {
          type: ChartType.Value,
          sourceCollectionName: 'jedi',
          aggregateFieldName: 'strength',
          aggregator: 'Sum',
        },
      });
    });

    it('should throw an error if the user cannot retrieve the chart', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canOnCollection.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      forestAdminClient.permissionService.canExecuteChart.mockResolvedValue(false);

      await expect(authorizationService.assertCanRetrieveChart({
        user,
        chartRequest: {
          type: ChartType.Value,
          sourceCollectionName: 'jedi',
          aggregateFieldName: 'strength',
          aggregator: 'Sum',
        },
      }))
        .rejects.toThrow(ForbiddenError);

      expect(forestAdminClient.permissionService.canExecuteChart).toHaveBeenCalledWith({
        chartRequest: {
          type: ChartType.Value,
          sourceCollectionName: 'jedi',
          aggregateFieldName: 'strength',
          aggregator: 'Sum',
        },
        userId: user.id,
        renderingId: user.renderingId,
      });
    });
  });

  describe('verifySignedActionParameters', () => {
    it('should return the signed parameters', () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.verifySignedActionParameters.mockReturnValue({
        foo: 'bar',
      });

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      expect(authorizationService.verifySignedActionParameters('signed')).toStrictEqual({
        foo: 'bar',
      });

      expect(forestAdminClient.verifySignedActionParameters).toHaveBeenCalledWith('signed');
    });
  });

  describe('assertCanApproveCustomAction', () => {
    it('should not throw when the user can approve the custom action', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canApproveCustomAction.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanApproveCustomAction({
        user,
        collectionName: 'collectionName',
        customActionName: 'customActionName',
        requesterId: 42,
      })).toResolve();

      expect(forestAdminClient.permissionService.canApproveCustomAction).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canApproveCustomAction).toHaveBeenCalledWith({
        collectionName: 'collectionName',
        customActionName: 'customActionName',
        requesterId: 42,
        userId: user.id,
      });
    });

    it('should throw when the user cannot approve the custom action', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canApproveCustomAction.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanApproveCustomAction({
        user,
        collectionName: 'collectionName',
        customActionName: 'customActionName',
        requesterId: 42,
      })).rejects.toThrow(ForbiddenError);
    });
  });

  describe('assertCanTriggerCustomAction', () => {
    it('should not throw when the user can trigger the custom action', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canTriggerCustomAction.mockResolvedValue(true);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanTriggerCustomAction({
        user,
        collectionName: 'collectionName',
        customActionName: 'customActionName',
      })).toResolve();

      expect(forestAdminClient.permissionService.canTriggerCustomAction).toHaveBeenCalledTimes(1);
      expect(forestAdminClient.permissionService.canTriggerCustomAction).toHaveBeenCalledWith({
        collectionName: 'collectionName',
        customActionName: 'customActionName',
        userId: user.id,
      });
    });

    it('should throw when the user cannot trigger the custom action', async () => {
      const context = makeContext();
      const { forestAdminClient } = context;

      forestAdminClient.permissionService.canTriggerCustomAction.mockResolvedValue(false);

      const authorizationService = new AuthorizationService(
        context as unknown as ConstructorParameters<typeof AuthorizationService>[0],
      );

      await expect(authorizationService.assertCanTriggerCustomAction({
        user,
        collectionName: 'collectionName',
        customActionName: 'customActionName',
      })).rejects.toThrow(ForbiddenError);
    });
  });
});
