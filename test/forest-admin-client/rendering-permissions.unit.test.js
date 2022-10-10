/* eslint-disable jest/prefer-expect-assertions */
import RenderingPermissionServiceForForestExpress from '../../src/forest-admin-client/rendering-permissions';

describe('unit > extended services > RenderingPermissionServiceForForestExpress', () => {
  function makeContext() {
    return {
      userPermissions: {
        getUserInfo: jest.fn(),
      },
    };
  }

  describe('getSegments', () => {
    it('should retrieve the rendering info, look for segments and return them', async () => {
      const segments = [
        { name: 'segment one', type: 'smart' },
        { name: 'segment two', type: 'manual', query: 'sql raw query' }];

      const team = { id: 1, name: 'dream' };

      const renderingPermissions = {
        team,
        collections: {
          collectionName: {
            segments,
          },
        },
        charts: new Set(),
      };

      const context = makeContext();
      const { userPermissions } = context;

      const options = {
        forestServerUrl: 'forestServerUrl',
        envSecret: 'envSecret',
        logger: jest.fn(),
      };

      const renderingPermissionService = new RenderingPermissionServiceForForestExpress(
        options,
        userPermissions,
      );

      const invalidateCacheStub = jest.spyOn(renderingPermissionService, 'invalidateCache');
      const loadPermissionsStub = jest.spyOn(renderingPermissionService, 'loadPermissions');
      loadPermissionsStub.mockResolvedValue(renderingPermissions);

      const result = await renderingPermissionService.getSegments({
        renderingId: 42,
        collectionName: 'collectionName',
      });

      expect(loadPermissionsStub).toHaveBeenCalledTimes(1);
      expect(loadPermissionsStub).toHaveBeenCalledWith('42');

      expect(invalidateCacheStub).not.toHaveBeenCalled();

      expect(result).toBe(segments);
    });

    it('should retry to get the permissions if a collection does not exist', async () => {
      const segments = [
        { name: 'segment one', type: 'smart' },
        { name: 'segment two', type: 'manual', query: 'sql raw query' }];

      const team = { id: 1, name: 'dream' };

      const renderingPermissions = {
        team,
        collections: {
          collectionName: {
            segments,
          },
        },
        charts: new Set(),
      };

      const context = makeContext();
      const { userPermissions } = context;

      const options = {
        forestServerUrl: 'forestServerUrl',
        envSecret: 'envSecret',
        logger: jest.fn(),
      };

      const renderingPermissionService = new RenderingPermissionServiceForForestExpress(
        options,
        userPermissions,
      );

      const invalidateCacheStub = jest.spyOn(renderingPermissionService, 'invalidateCache');
      const loadPermissionsStub = jest.spyOn(renderingPermissionService, 'loadPermissions');
      loadPermissionsStub.mockResolvedValueOnce({
        team,
        collections: {
          books: {
            segments: [],
          },
        },
        charts: new Set(),
      });
      loadPermissionsStub.mockResolvedValueOnce(renderingPermissions);

      const result = await renderingPermissionService.getSegments({
        renderingId: 42,
        collectionName: 'collectionName',
      });

      expect(loadPermissionsStub).toHaveBeenCalledTimes(2);
      expect(loadPermissionsStub).toHaveBeenNthCalledWith(1, '42');
      expect(loadPermissionsStub).toHaveBeenNthCalledWith(2, '42');

      expect(invalidateCacheStub).toHaveBeenCalledTimes(1);

      expect(result).toBe(segments);
    });

    it('should not retry more than once', async () => {
      const renderingPermissions = {
        team: {},
        collections: {},
        stats: {},
      };

      const context = makeContext();
      const { userPermissions } = context;

      const options = {
        forestServerUrl: 'forestServerUrl',
        envSecret: 'envSecret',
        logger: jest.fn(),
      };

      const renderingPermissionService = new RenderingPermissionServiceForForestExpress(
        options,
        userPermissions,
      );

      const invalidateCacheStub = jest.spyOn(renderingPermissionService, 'invalidateCache');
      const loadPermissionsStub = jest.spyOn(renderingPermissionService, 'loadPermissions');
      loadPermissionsStub.mockResolvedValue(renderingPermissions);

      const result = await renderingPermissionService.getSegments({
        renderingId: 42,
        collectionName: 'collectionName',
      });

      expect(loadPermissionsStub).toHaveBeenCalledTimes(2);
      expect(invalidateCacheStub).toHaveBeenCalledTimes(1);

      expect(result).toBeNull();
    });
  });
});
