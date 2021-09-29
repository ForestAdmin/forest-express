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
        expect.assertions(5);

        const permissions = { myPermissions: {} };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        const isAllowed = jest
          .spyOn(PermissionsChecker, '_isAllowed')
          .mockImplementation().mockReturnValue(true);

        const permissionsInfos = { info: 'info' };
        const collectionName = 'Siths';
        const permissionName = 'browseEnabled';
        await expect(permissionsChecker.checkPermissions(
          1, collectionName, permissionName, permissionsInfos,
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
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos);

        isAllowed.mockRestore();
      });

      describe('when cache seems outdated', () => {
        it('should force retrieval of permissions', async () => {
          expect.assertions(7);

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

          const isAllowed = jest.spyOn(PermissionsChecker, '_isAllowed').mockImplementation()
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

          const permissionsInfos = { info: 'info' };
          const collectionName = 'Siths';
          const permissionName = 'browseEnabled';
          await expect(permissionsChecker.checkPermissions(
            1, collectionName, permissionName, permissionsInfos,
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
            .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos);
          expect(PermissionsChecker._isAllowed)
            .toHaveBeenCalledWith(permissionsAfterRefresh, permissionName, permissionsInfos);

          isAllowed.mockRestore();
        });
      });
    });

    describe('with multiple permissions cache', () => {
      it('should check correctly the permissions', async () => {
        expect.assertions(5);

        const permissions = { myPermissions: {} };
        const permissionsGetter = {
          getPermissions: jest.fn().mockReturnValue(permissions),
        };

        const permissionsChecker = new PermissionsChecker({
          ...defaultDependencies,
          permissionsGetter,
        });

        const isAllowed = jest.spyOn(PermissionsChecker, '_isAllowed').mockImplementation().mockReturnValue(true);

        const permissionsInfos = { info: 'info' };
        const collectionName = 'Siths';
        const permissionName = 'browseEnabled';
        const environmentId = 10;
        await expect(permissionsChecker.checkPermissions(
          1, collectionName, permissionName, permissionsInfos, environmentId,
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
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos);

        isAllowed.mockRestore();
      });
    });

    describe('with liveQueries permissions', () => {
      it('should check correctly the permissions', async () => {
        expect.assertions(6);

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
          1, collectionName, permissionName, permissionsInfos,
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
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos);
        expect(isAllowed).toHaveReturned();

        isAllowed.mockRestore();
      });
    });

    describe('with special union segmentQuery permissions', () => {
      it('should check correctly the permissions', async () => {
        expect.assertions(6);

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
          1, collectionName, permissionName, permissionsInfos,
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
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos);
        expect(isAllowed).toHaveReturned();

        isAllowed.mockRestore();
        isPermissionAllowed.mockRestore();
      });
    });
  });

  describe('_isCollectionBrowseAllowed', () => {
    describe('without segmentQuery permissionInfos', () => {
      it('should only check permissions using _isPermissionAllowed', async () => {
        expect.assertions(3);

        const permissions = { collection: { browseEnabled: 'browseEnabled' }, segments: ['SELECT COUNT(*) AS value FROM products;'] };
        const permissionsInfos = { userId: 13 };

        const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
        isPermissionAllowed.mockResolvedValue(true);


        expect(await PermissionsChecker._isCollectionBrowseAllowed(
          permissions, permissionsInfos,
        )).toBeTrue();

        expect(isPermissionAllowed).toHaveBeenCalledTimes(1);
        expect(isPermissionAllowed)
          .toHaveBeenCalledWith('browseEnabled', 13);

        isPermissionAllowed.mockRestore();
      });
    });

    describe('with segmentQuery permissionInfos but no segments permissions', () => {
      it('should return false', async () => {
        expect.assertions(2);
        const permissions = { collection: { browseEnabled: 'browseEnabled' } };
        const permissionsInfos = { userId: 13, segmentQuery: 'SELECT COUNT(*) AS value FROM products;' };

        const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
        isPermissionAllowed.mockResolvedValue(true);

        expect(await PermissionsChecker._isCollectionBrowseAllowed(
          permissions, permissionsInfos,
        )).toBeFalse();

        expect(isPermissionAllowed).toHaveBeenCalledTimes(0);

        isPermissionAllowed.mockRestore();
      });
    });

    describe('with segmentQuery permissionInfos and segments permissions', () => {
      describe('when the segmentQuery is included in the segments', () => {
        it('should return true', async () => {
          expect.assertions(3);

          const permissions = { collection: { browseEnabled: 'browseEnabled' }, segments: ['SELECT COUNT(*) AS value FROM products;', 'SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2;'] };
          const permissionsInfos = { userId: 13, segmentQuery: 'SELECT COUNT(*) AS value FROM products/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2' };

          const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
          isPermissionAllowed.mockResolvedValue(true);

          expect(await PermissionsChecker._isCollectionBrowseAllowed(
            permissions, permissionsInfos,
          )).toBeTrue();

          expect(isPermissionAllowed).toHaveBeenCalledTimes(1);
          expect(isPermissionAllowed)
            .toHaveBeenCalledWith('browseEnabled', 13);

          isPermissionAllowed.mockRestore();
        });
      });

      describe('when the segmentQuery is not included in the segments', () => {
        it('should return false', async () => {
          expect.assertions(2);

          const permissions = { collection: { browseEnabled: 'browseEnabled' }, segments: ['SELECT COUNT(*) AS value FROM products;', 'SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2;'] };
          // MALICIOUS QUERY in the UNION
          const permissionsInfos = { userId: 13, segmentQuery: 'SELECT 1 AS id FROM user_tokens WHERE user_tokens.user_id = 1 AND get_bit(user_tokens.session_token, %d) = 1;' };

          const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
          isPermissionAllowed.mockResolvedValue(true);

          expect(await PermissionsChecker._isCollectionBrowseAllowed(
            permissions, permissionsInfos,
          )).toBeFalse();

          expect(isPermissionAllowed).toHaveBeenCalledTimes(0);

          isPermissionAllowed.mockRestore();
        });
      });
    });

    describe('with special union segmentQuery permissions', () => {
      it('should check that the (union) queries are included in the list of segments query', async () => {
        expect.assertions(2);

        const permissions = { collection: { browseEnabled: 'browseEnabled' }, segments: ['SELECT COUNT(*) AS value FROM products;', 'SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2;'] };
        // MALICIOUS QUERY in the UNION
        const permissionsInfos = { userId: 13, segmentQuery: 'SELECT 1 AS id FROM user_tokens WHERE user_tokens.user_id = 1 AND get_bit(user_tokens.session_token, %d) = 1/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION SELECT column_name(s) FROM table1 UNION SELECT column_name(s) FROM table2' };

        const isPermissionAllowed = jest.spyOn(PermissionsChecker, '_isPermissionAllowed');
        isPermissionAllowed.mockResolvedValue(true);

        expect(await PermissionsChecker._isCollectionBrowseAllowed(
          permissions, permissionsInfos,
        )).toBeFalse();

        expect(isPermissionAllowed).toHaveBeenCalledTimes(0);

        isPermissionAllowed.mockRestore();
      });
    });
  });
});
