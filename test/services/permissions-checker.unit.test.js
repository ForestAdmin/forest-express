const PermissionsChecker = require('../../src/services/permissions-checker');

describe('services > PermissionsChecker', () => {
  const defaultDependencies = {
    baseFilterParser: {},
    logger: {},
    permissionsGetter: {},
  };

  describe('checkPermissions', () => {
    describe('with single permissions cache', () => {
      it('should check correctly the permissions', async () => {
        const user = { renderingId: 1 };
        const permissions = { myPermissions: {} };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        jest
          .spyOn(PermissionsChecker, '_isAllowed')
          .mockImplementation().mockReturnValue(true);

        const permissionsInfos = { info: 'info' };
        const collectionName = 'Siths';
        const permissionName = 'browseEnabled';
        await expect(permissionsChecker.checkPermissions(
          user,
          collectionName,
          permissionName,
          permissionsInfos,
        )).toResolve();

        expect(permissionsGetter.getPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter.getPermissions).toHaveBeenCalledWith(
          1,
          collectionName,
          permissionName,
          { forceRetrieve: false, environmentId: undefined },
        );

        expect(PermissionsChecker._isAllowed).toHaveBeenCalledTimes(1);
        expect(PermissionsChecker._isAllowed)
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos, user);
      });

      describe('when cache seems outdated', () => {
        it('should force retrieval of permissions', async () => {
          const user = { renderingId: 1 };
          const permissions = { myPermissions: {} };
          const permissionsAfterRefresh = { myPermissionsNew: {} };
          const permissionsGetter = {
            getPermissions: jest.fn()
              .mockReturnValueOnce(permissions)
              .mockReturnValueOnce(permissionsAfterRefresh),
          };

          const permissionsChecker = new PermissionsChecker({
            ...defaultDependencies,
            permissionsGetter,
          });

          jest.spyOn(PermissionsChecker, '_isAllowed').mockImplementation()
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

          const permissionsInfos = { info: 'info' };
          const collectionName = 'Siths';
          const permissionName = 'browseEnabled';
          await expect(permissionsChecker.checkPermissions(
            user,
            collectionName,
            permissionName,
            permissionsInfos,
          )).toResolve();

          expect(permissionsGetter.getPermissions).toHaveBeenCalledTimes(2);
          expect(permissionsGetter.getPermissions).toHaveBeenCalledWith(
            1,
            collectionName,
            permissionName,
            { forceRetrieve: false, environmentId: undefined },
          );
          expect(permissionsGetter.getPermissions).toHaveBeenCalledWith(
            1,
            collectionName,
            permissionName,
            { forceRetrieve: true, environmentId: undefined },
          );

          expect(PermissionsChecker._isAllowed).toHaveBeenCalledTimes(2);
          expect(PermissionsChecker._isAllowed)
            .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos, user);
          expect(PermissionsChecker._isAllowed)
            .toHaveBeenCalledWith(permissionsAfterRefresh, permissionName, permissionsInfos, user);
        });
      });
    });

    describe('with multiple permissions cache', () => {
      it('should check correctly the permissions', async () => {
        const user = { renderingId: 1 };
        const permissions = { myPermissions: {} };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        jest.spyOn(PermissionsChecker, '_isAllowed').mockImplementation().mockReturnValue(true);

        const permissionsInfos = { info: 'info' };
        const collectionName = 'Siths';
        const permissionName = 'browseEnabled';
        const environmentId = 10;
        await expect(permissionsChecker.checkPermissions(
          user,
          collectionName,
          permissionName,
          permissionsInfos,
          environmentId,
        )).toResolve();

        expect(permissionsGetter.getPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter.getPermissions).toHaveBeenCalledWith(
          1,
          collectionName,
          permissionName,
          { forceRetrieve: false, environmentId },
        );

        expect(PermissionsChecker._isAllowed).toHaveBeenCalledTimes(1);
        expect(PermissionsChecker._isAllowed)
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos, user);
      });
    });

    describe('with liveQueries permissions', () => {
      it('should check correctly the permissions', async () => {
        const user = { renderingId: 1, permissionLevel: 'user' };
        const permissions = { stats: { queries: ['SELECT COUNT(*) AS value FROM products;'] } };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        const isAllowed = jest.spyOn(PermissionsChecker, '_isAllowed');

        const permissionsInfos = 'SELECT COUNT(*) AS value FROM products;';
        const collectionName = null;
        const permissionName = 'liveQueries';

        await expect(permissionsChecker.checkPermissions(
          user,
          collectionName,
          permissionName,
          permissionsInfos,
        )).toResolve();

        expect(permissionsGetter.getPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter.getPermissions).toHaveBeenCalledWith(
          1,
          collectionName,
          permissionName,
          { forceRetrieve: false, environmentId: undefined },
        );

        expect(isAllowed).toHaveBeenCalledTimes(1);
        expect(isAllowed)
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos, user);
        expect(isAllowed).toHaveReturned();
      });

      it('should allow live query when permissionLevel admin', async () => {
        const user = { renderingId: 1, permissionLevel: 'admin' };
        const permissions = { stats: { queries: [] } };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        const isAllowed = jest.spyOn(PermissionsChecker, '_isAllowed');

        const permissionsInfos = 'SELECT COUNT(*) AS value FROM products;';
        const collectionName = null;
        const permissionName = 'liveQueries';

        await expect(permissionsChecker.checkPermissions(
          user,
          collectionName,
          permissionName,
          permissionsInfos,
        )).toResolve();

        expect(permissionsGetter.getPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter.getPermissions).toHaveBeenCalledWith(
          1,
          collectionName,
          permissionName,
          { forceRetrieve: false, environmentId: undefined },
        );

        expect(isAllowed).toHaveBeenCalledTimes(1);
        expect(isAllowed)
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos, user);
        expect(isAllowed).toHaveReturned();
      });

      it('should reject live query when not in allow list', async () => {
        const user = { renderingId: 1, permissionLevel: 'user' };
        const permissions = { stats: { queries: [] } };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        const permissionsInfos = 'SELECT COUNT(*) AS value FROM products;';
        const collectionName = null;
        const permissionName = 'liveQueries';

        await expect(permissionsChecker.checkPermissions(
          user,
          collectionName,
          permissionName,
          permissionsInfos,
        )).toReject(new Error('Chart with SQL access forbidden - You are not allow to run this query'));
      });
    });

    describe('with statWithParameters permissions', () => {
      it('should reject simple chart when not in allow list', async () => {
        const user = { renderingId: 1, permissionLevel: 'user' };
        const permissions = {
          stats: {
            objectives: [],
          },
        };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        const parametersChartRequestInfo = {
          type: 'Objective',
          collection: 'comments',
          aggregate: 'Count',
        };
        const collectionName = null;
        const permissionName = 'statWithParameters';

        await expect(permissionsChecker.checkPermissions(
          user,
          collectionName,
          permissionName,
          parametersChartRequestInfo,
        )).toReject(new Error('Simple Chart access forbidden - You are not allow to display this chart'));
      });
    });

    describe('with special union segmentQuery permissions', () => {
      it('should check correctly the permissions', async () => {
        const user = { renderingId: 1, permissionLevel: 'user' };
        const permissions = { collection: {}, segments: ['SELECT COUNT(*) AS value FROM products;', 'SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2;'] };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        const isAllowed = jest.spyOn(PermissionsChecker, '_isAllowed');
        const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
        isPermissionAllowed.mockResolvedValue(true);

        const permissionsInfos = { segmentQuery: 'SELECT COUNT(*) AS value FROM products/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2' };
        const collectionName = 'Siths';
        const permissionName = 'browseEnabled';

        await expect(permissionsChecker.checkPermissions(
          user,
          collectionName,
          permissionName,
          permissionsInfos,
        )).toResolve();

        expect(permissionsGetter.getPermissions).toHaveBeenCalledTimes(1);
        expect(permissionsGetter.getPermissions).toHaveBeenCalledWith(
          1,
          collectionName,
          permissionName,
          { forceRetrieve: false, environmentId: undefined },
        );

        expect(isAllowed).toHaveBeenCalledTimes(1);
        expect(isAllowed)
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos, user);
        expect(isAllowed).toHaveReturned();
      });
    });
  });

  describe('_isCollectionBrowseAllowed', () => {
    describe('without segmentQuery permissionInfos', () => {
      it('should only check permissions using _isPermissionAllowed', async () => {
        const permissions = { collection: { browseEnabled: 'browseEnabled' }, segments: ['SELECT COUNT(*) AS value FROM products;'] };
        const permissionsInfos = { userId: 13 };

        const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
        isPermissionAllowed.mockResolvedValue(true);

        await expect(PermissionsChecker._isCollectionBrowseAllowed(
          permissions,
          permissionsInfos,
        )).resolves.toBeTrue();

        expect(isPermissionAllowed).toHaveBeenCalledTimes(1);
        expect(isPermissionAllowed)
          .toHaveBeenCalledWith('browseEnabled', 13);
      });
    });

    describe('with segmentQuery permissionInfos but no segments permissions', () => {
      it('should return false', async () => {
        const permissions = { collection: { browseEnabled: 'browseEnabled' } };
        const permissionsInfos = { userId: 13, segmentQuery: 'SELECT COUNT(*) AS value FROM products;' };

        const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
        isPermissionAllowed.mockResolvedValue(true);

        await expect(PermissionsChecker._isCollectionBrowseAllowed(
          permissions,
          permissionsInfos,
        )).resolves.toBeFalse();

        expect(isPermissionAllowed).toHaveBeenCalledTimes(0);
      });
    });

    describe('with segmentQuery permissionInfos and segments permissions', () => {
      describe('when the segmentQuery is included in the segments', () => {
        it('should return true', async () => {
          const permissions = { collection: { browseEnabled: 'browseEnabled' }, segments: ['SELECT COUNT(*) AS value FROM products;', 'SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2;'] };
          const permissionsInfos = { userId: 13, segmentQuery: 'SELECT COUNT(*) AS value FROM products/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2' };

          const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
          isPermissionAllowed.mockResolvedValue(true);

          await expect(PermissionsChecker._isCollectionBrowseAllowed(
            permissions,
            permissionsInfos,
          )).resolves.toBeTrue();

          expect(isPermissionAllowed).toHaveBeenCalledTimes(1);
          expect(isPermissionAllowed)
            .toHaveBeenCalledWith('browseEnabled', 13);
        });
      });

      describe('when the segmentQuery is not included in the segments', () => {
        it('should return false', async () => {
          const permissions = { collection: { browseEnabled: 'browseEnabled' }, segments: ['SELECT COUNT(*) AS value FROM products;', 'SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2;'] };
          // MALICIOUS QUERY in the UNION
          const permissionsInfos = { userId: 13, segmentQuery: 'SELECT 1 AS id FROM user_tokens WHERE user_tokens.user_id = 1 AND get_bit(user_tokens.session_token, %d) = 1;' };

          const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
          isPermissionAllowed.mockResolvedValue(true);

          await expect(PermissionsChecker._isCollectionBrowseAllowed(
            permissions,
            permissionsInfos,
          )).resolves.toBeFalse();

          expect(isPermissionAllowed).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('with special union segmentQuery permissions', () => {
      it('should check that the (union) queries are included in the list of segments query', async () => {
        const permissions = { collection: { browseEnabled: 'browseEnabled' }, segments: ['SELECT COUNT(*) AS value FROM products;', 'SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2;'] };
        // MALICIOUS QUERY in the UNION
        const permissionsInfos = { userId: 13, segmentQuery: 'SELECT 1 AS id FROM user_tokens WHERE user_tokens.user_id = 1 AND get_bit(user_tokens.session_token, %d) = 1/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2' };

        const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
        isPermissionAllowed.mockResolvedValue(true);

        await expect(PermissionsChecker._isCollectionBrowseAllowed(
          permissions,
          permissionsInfos,
        )).resolves.toBeFalse();

        expect(isPermissionAllowed).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('_isLiveQueryAllowed', () => {
    describe('with user permission level', () => {
      it('should return true when the query is allowed', async () => {
        const sqlQuery = 'SELECT COUNT(*) AS value FROM products;';
        const user = { permissionLevel: 'user' };

        expect(PermissionsChecker._isLiveQueryAllowed([sqlQuery], sqlQuery, user)).toBeTrue();
      });

      it('should return false when the query is not allowed', async () => {
        const user = { permissionLevel: 'user' };

        expect(PermissionsChecker._isLiveQueryAllowed(['some query'], 'SELECT COUNT(*) AS value FROM products;', user)).toBeFalse();
      });
    });

    describe('with user permission admin', () => {
      it('should return true even if the the query is not allowed yet', async () => {
        const sqlQuery = 'SELECT COUNT(*) AS value FROM products;';
        const user = { permissionLevel: 'admin' };

        expect(PermissionsChecker._isLiveQueryAllowed(['another sql'], sqlQuery, user)).toBeTrue();
      });
    });

    describe('with user permission editor', () => {
      it('should return true even if the the query is not allowed yet', async () => {
        const sqlQuery = 'SELECT COUNT(*) AS value FROM products;';
        const user = { permissionLevel: 'editor' };

        expect(PermissionsChecker._isLiveQueryAllowed(['another sql'], sqlQuery, user)).toBeTrue();
      });
    });

    describe('with user permission developer', () => {
      it('should return true even if the the query is not allowed yet', async () => {
        const sqlQuery = 'SELECT COUNT(*) AS value FROM products;';
        const user = { permissionLevel: 'developer' };

        expect(PermissionsChecker._isLiveQueryAllowed(['another sql'], sqlQuery, user)).toBeTrue();
      });
    });
  });

  describe('_isStatWithParametersAllowed', () => {
    const parametersChartRequestInfo = {
      type: 'Value',
      collection: 'comments',
      aggregate: 'Count',
    };

    describe('with user permission level', () => {
      it('should return true when the query is allowed', async () => {
        const user = { permissionLevel: 'user' };

        expect(PermissionsChecker._isStatWithParametersAllowed({
          values: [{
            type: 'Value',
            collection: 'comments',
            aggregate: 'Count',
          }],
        }, parametersChartRequestInfo, user)).toBeTrue();
      });

      it('should return false when the query is not allowed', async () => {
        const user = { permissionLevel: 'user' };

        expect(PermissionsChecker._isStatWithParametersAllowed({
          values: [{
            type: 'other',
          }],
        }, parametersChartRequestInfo, user)).toBeFalse();
      });
    });

    describe('with user permission admin', () => {
      it('should return true even if the the query is not allowed yet', async () => {
        const user = { permissionLevel: 'admin' };

        expect(PermissionsChecker._isStatWithParametersAllowed({
          values: [{
            type: 'other',
          }],
        }, parametersChartRequestInfo, user)).toBeTrue();
      });
    });

    describe('with user permission editor', () => {
      it('should return true even if the the query is not allowed yet', async () => {
        const user = { permissionLevel: 'editor' };

        expect(PermissionsChecker._isStatWithParametersAllowed({
          values: [{
            type: 'other',
          }],
        }, parametersChartRequestInfo, user)).toBeTrue();
      });
    });

    describe('with user permission developer', () => {
      it('should return true even if the the query is not allowed yet', async () => {
        const user = { permissionLevel: 'developer' };

        expect(PermissionsChecker._isStatWithParametersAllowed({
          values: [{
            type: 'other',
          }],
        }, parametersChartRequestInfo, user)).toBeTrue();
      });
    });
  });
});
