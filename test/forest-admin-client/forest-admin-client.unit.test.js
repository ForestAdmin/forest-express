/* eslint-disable jest/prefer-expect-assertions */
import ForestAdminClientForForestExpress from '../../src/forest-admin-client/forest-admin-client';

describe('unit > extended services > ForestAdminClientForForestExpress', () => {
  function makeContext() {
    return {
      actionPermissionService: {},
      renderingPermissionService: {
        getSegments: jest.fn(),
      },
    };
  }

  describe('canBrowse', () => {
    describe('without any segment query', () => {
      it('should return true when the user can browse a collection', async () => {
        const context = makeContext();
        const { actionPermissionService, renderingPermissionService } = context;

        const options = {
          forestServerUrl: 'forestServerUrl',
          envSecret: 'envSecret',
        };

        const forestAdminClientForForestExpress = new ForestAdminClientForForestExpress(
          options,
          actionPermissionService,
          renderingPermissionService,
        );

        const canOnCollectionStub = jest.spyOn(forestAdminClientForForestExpress, 'canOnCollection');
        canOnCollectionStub.mockResolvedValue(true);

        await expect(forestAdminClientForForestExpress.canBrowse({
          userId: 1,
          renderingId: 42,
          collectionName: 'collectionName',
          segmentQuery: undefined,
        })).toResolve();

        expect(canOnCollectionStub).toHaveBeenCalledTimes(1);
        expect(canOnCollectionStub).toHaveBeenCalledWith({
          userId: 1,
          event: 'browse',
          collectionName: 'collectionName',
        });
      });

      it('should return false when the user cannot browse a collection', async () => {
        const context = makeContext();
        const { actionPermissionService, renderingPermissionService } = context;

        const options = {
          forestServerUrl: 'forestServerUrl',
          envSecret: 'envSecret',
        };

        const forestAdminClientForForestExpress = new ForestAdminClientForForestExpress(
          options,
          actionPermissionService,
          renderingPermissionService,
        );

        const canOnCollectionStub = jest.spyOn(forestAdminClientForForestExpress, 'canOnCollection');
        canOnCollectionStub.mockResolvedValue(false);

        const result = await forestAdminClientForForestExpress.canBrowse({
          userId: 1,
          renderingId: 42,
          collectionName: 'collectionName',
          segmentQuery: undefined,
        });

        expect(result).toBeFalse();

        expect(canOnCollectionStub).toHaveBeenCalledTimes(1);
        expect(canOnCollectionStub).toHaveBeenCalledWith({
          userId: 1,
          event: 'browse',
          collectionName: 'collectionName',
        });
      });
    });

    describe('with segment query (canBrowseSegment)', () => {
      it('should return true if there is no segmentQuery', async () => {
        const context = makeContext();
        const { actionPermissionService, renderingPermissionService } = context;

        const options = {
          forestServerUrl: 'forestServerUrl',
          envSecret: 'envSecret',
        };

        const forestAdminClientForForestExpress = new ForestAdminClientForForestExpress(
          options,
          actionPermissionService,
          renderingPermissionService,
        );

        const canOnCollectionStub = jest.spyOn(forestAdminClientForForestExpress, 'canOnCollection');
        canOnCollectionStub.mockResolvedValue(true);

        const canBrowseSegmentStub = jest.spyOn(forestAdminClientForForestExpress, 'canBrowseSegment');

        const result = await forestAdminClientForForestExpress.canBrowse({
          userId: 1,
          renderingId: 42,
          collectionName: 'collectionName',
          segmentQuery: undefined,
        });

        expect(result).toBeTrue();

        expect(canBrowseSegmentStub).toHaveBeenCalledTimes(1);
      });

      it('should return false when there is no segment', async () => {
        const context = makeContext();
        const { actionPermissionService, renderingPermissionService } = context;

        const options = {
          forestServerUrl: 'forestServerUrl',
          envSecret: 'envSecret',
        };

        const forestAdminClientForForestExpress = new ForestAdminClientForForestExpress(
          options,
          actionPermissionService,
          renderingPermissionService,
        );

        const canOnCollectionStub = jest.spyOn(forestAdminClientForForestExpress, 'canOnCollection');
        canOnCollectionStub.mockResolvedValue(true);

        renderingPermissionService.getSegments.mockResolvedValue(null);

        const result = await forestAdminClientForForestExpress.canBrowse({
          userId: 1,
          renderingId: 42,
          collectionName: 'collectionName',
          segmentQuery: 'segmentQuery',
        });

        expect(result).toBeFalse();

        expect(renderingPermissionService.getSegments).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('canBrowseSegment', () => {
    describe('special union made by the frontend', () => {
      it('should return false when any segments from the queries is not allowed', async () => {
        const context = makeContext();
        const { actionPermissionService, renderingPermissionService } = context;

        const options = {
          forestServerUrl: 'forestServerUrl',
          envSecret: 'envSecret',
        };

        const forestAdminClientForForestExpress = new ForestAdminClientForForestExpress(
          options,
          actionPermissionService,
          renderingPermissionService,
        );

        renderingPermissionService.getSegments.mockResolvedValue([
          { query: 'segmentQuery1;' },
          { query: 'segmentQuery2;' },
          { query: 'segmentQuery3;' },
        ]);

        const result = await forestAdminClientForForestExpress.canBrowseSegment({
          renderingId: 42,
          collectionName: 'collectionName',
          segmentQuery: 'segmentQuery1/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION segmentQuery2/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION segmentQueryNotAllowed',
        });

        expect(result).toBeFalse();
      });

      it('should return true when every segments from the queries is not allowed', async () => {
        const context = makeContext();
        const { actionPermissionService, renderingPermissionService } = context;

        const options = {
          forestServerUrl: 'forestServerUrl',
          envSecret: 'envSecret',
        };

        const forestAdminClientForForestExpress = new ForestAdminClientForForestExpress(
          options,
          actionPermissionService,
          renderingPermissionService,
        );

        renderingPermissionService.getSegments.mockResolvedValue([
          { query: 'segmentQuery1;' },
          { query: 'segmentQuery2;' },
          { query: 'segmentQuery3;' },
        ]);

        const result = await forestAdminClientForForestExpress.canBrowseSegment({
          renderingId: 42,
          collectionName: 'collectionName',
          segmentQuery: 'segmentQuery1/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION segmentQuery2/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION segmentQuery3',
        });

        expect(result).toBeTrue();
      });
    });
  });
});
