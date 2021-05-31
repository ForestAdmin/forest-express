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

        jest.spyOn(permissionsChecker, '_isAllowed').mockImplementation().mockReturnValue(true);

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

        expect(permissionsChecker._isAllowed).toHaveBeenCalledTimes(1);
        expect(permissionsChecker._isAllowed)
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos);
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

          jest.spyOn(permissionsChecker, '_isAllowed').mockImplementation()
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

          expect(permissionsChecker._isAllowed).toHaveBeenCalledTimes(2);
          expect(permissionsChecker._isAllowed)
            .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos);
          expect(permissionsChecker._isAllowed)
            .toHaveBeenCalledWith(permissionsAfterRefresh, permissionName, permissionsInfos);
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

        jest.spyOn(permissionsChecker, '_isAllowed').mockImplementation().mockReturnValue(true);

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

        expect(permissionsChecker._isAllowed).toHaveBeenCalledTimes(1);
        expect(permissionsChecker._isAllowed)
          .toHaveBeenCalledWith(permissions, permissionName, permissionsInfos);
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

        const isAllowed = jest.spyOn(permissionsChecker, '_isAllowed');

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
      });
    });
  });
});
