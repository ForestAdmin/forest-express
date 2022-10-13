import ScopeManager from '../../src/services/scope-manager';

describe('services > ScopeManager', () => {
  function makeContext() {
    return {
      forestAdminClient: {
        getScope: jest.fn(),
      },
    };
  }

  const defaultUser = {
    id: '1',
    email: 'mycroft@canner.com',
    firstName: 'Mycroft',
    lastName: 'Canner',
    team: 'humanist',
    renderingId: 334,
  };
  const defaultRenderingScopes = {
    myCollection: {
      scope: {
        filter: {
          aggregator: 'and',
          conditions: [
            {
              field: 'name',
              operator: 'equal',
              value: 'Thisbe',
            },
          ],
        },
        dynamicScopesValues: { },
      },
    },
  };

  describe('appendScopeForUser', () => {
    it('should work with neither scopes nor customer filter', async () => {
      expect.assertions(1);

      const context = makeContext();
      const scopeManager = new ScopeManager(context);
      context.forestAdminClient.getScope.mockResolvedValue(undefined);
      const newFilter = await scopeManager.appendScopeForUser(undefined, defaultUser, 'myCollection');

      expect(newFilter).toBeUndefined();
    });

    it('should work with scopes, but not customer filter', async () => {
      expect.assertions(1);

      const context = makeContext();
      const scopeManager = new ScopeManager(context);
      context.forestAdminClient.getScope
        .mockResolvedValue({ field: 'id', operator: 'equal', value: 1 });
      const newFilter = await scopeManager.appendScopeForUser(undefined, defaultUser, 'myCollection');

      expect(newFilter).toBe('{"field":"id","operator":"equal","value":1}');
    });

    it('should work with customer filter, but no scopes', async () => {
      expect.assertions(1);

      const context = makeContext();
      const scopeManager = new ScopeManager(context);
      context.forestAdminClient.getScope.mockResolvedValue(undefined);
      const newFilter = await scopeManager
        .appendScopeForUser('{"field":"id","operator":"equal","value":1}', defaultUser, 'myCollection');

      expect(newFilter).toBe('{"field":"id","operator":"equal","value":1}');
    });

    it('should work with both customer filter and scopes', async () => {
      expect.assertions(1);

      const context = makeContext();
      const scopeManager = new ScopeManager(context);
      context.forestAdminClient.getScope
        .mockResolvedValue({ field: 'book.id', operator: 'equal', value: 1 });
      const newFilter = await scopeManager
        .appendScopeForUser('{"field":"id","operator":"equal","value":1}', defaultUser, 'myCollection');

      expect(newFilter).toStrictEqual(JSON.stringify({
        aggregator: 'and',
        conditions: [
          { field: 'id', operator: 'equal', value: 1 },
          { field: 'book.id', operator: 'equal', value: 1 },
        ],
      }));
    });
  });

  describe('getScopeForUser', () => {
    describe('with bad inputs', () => {
      const context = makeContext();
      const scopeManager = new ScopeManager(context);

      describe('with a user having no renderingId', () => {
        it('should throw an error', async () => {
          expect.assertions(1);

          await expect(
            scopeManager.getScopeForUser({}, 'myCollection'),
          ).rejects.toStrictEqual(new Error('Missing required renderingId'));
        });
      });

      describe('without providing a collectionName', () => {
        it('should throw an error', async () => {
          expect.assertions(1);

          await expect(
            scopeManager.getScopeForUser(defaultUser),
          ).rejects.toStrictEqual(new Error('Missing required collectionName'));
        });
      });
    });

    describe('when accessing the rendering scopes for the first time', () => {
      it('should retrieve and return the collection scope filters', async () => {
        expect.assertions(3);

        const context = makeContext();
        context.forestAdminClient.getScope.mockResolvedValue(
          defaultRenderingScopes.myCollection.scope.filter,
        );

        const scopeManager = new ScopeManager(context);

        const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

        expect(context.forestAdminClient.getScope).toHaveBeenCalledTimes(1);
        expect(context.forestAdminClient.getScope).toHaveBeenCalledWith({ renderingId: defaultUser.renderingId, userId: defaultUser.id, collectionName: 'myCollection' });
        expect(scopes).toStrictEqual(defaultRenderingScopes.myCollection.scope.filter);
      });
    });

    describe('when no scopes on collection', () => {
      it('should return null', async () => {
        expect.assertions(1);

        const context = makeContext();
        context.forestAdminClient.getScope.mockResolvedValue(null);

        const scopeManager = new ScopeManager(context);

        const scopes = await scopeManager.getScopeForUser(defaultUser, 'myOtherCollection');

        expect(scopes).toBeNull();
      });
    });
  });
});
