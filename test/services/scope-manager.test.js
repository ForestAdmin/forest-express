import ScopeManager from '../../src/services/scope-manager';
import BaseFiltersParser from '../../src/services/base-filters-parser';
import { InvalidFiltersFormat } from '../../src/utils/error';

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
      const scopeManager = new ScopeManager({});
      jest.spyOn(scopeManager, 'getScopeForUser').mockResolvedValue(undefined);
      const newFilter = await scopeManager.appendScopeForUser(undefined, defaultUser, 'myCollection');

      expect(newFilter).toBeUndefined();
    });

    it('should work with scopes, but not customer filter', async () => {
      const context = makeContext();
      const scopeManager = new ScopeManager(context);
      context.forestAdminClient.getScope
        .mockResolvedValue({ field: 'id', operator: 'equal', value: 1 });
      const newFilter = await scopeManager.appendScopeForUser(undefined, defaultUser, 'myCollection');

      expect(newFilter).toBe('{"field":"id","operator":"equal","value":1}');
    });

    it('should work with customer filter, but no scopes', async () => {
      const context = makeContext();
      const scopeManager = new ScopeManager(context);
      context.forestAdminClient.getScope.mockResolvedValue(undefined);
      const newFilter = await scopeManager
        .appendScopeForUser('{"field":"id","operator":"equal","value":1}', defaultUser, 'myCollection');

      expect(newFilter).toBe('{"field":"id","operator":"equal","value":1}');
    });

    it('should work with both customer filter and scopes', async () => {
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

    describe('when both a filter and a scope apply', () => {
      const scope = {
        aggregator: 'or',
        conditions: [
          { field: 'team', operator: 'equal', value: 'humanist' },
          { field: 'owner.email', operator: 'equal', value: 'mycroft@canner.com' },
        ],
      };

      function previouslyCombined(filter) {
        return `{"aggregator":"and","conditions":[${filter},${JSON.stringify(scope)}]}`;
      }

      async function combine(filter) {
        const context = makeContext();
        context.forestAdminClient.getScope.mockResolvedValue(scope);
        const scopeManager = new ScopeManager(context);
        const combined = await scopeManager.appendScopeForUser(filter, defaultUser, 'myCollection');

        expect(context.forestAdminClient.getScope).toHaveBeenCalledWith({
          renderingId: defaultUser.renderingId,
          userId: defaultUser.id,
          collectionName: 'myCollection',
        });

        return combined;
      }

      const legitimateFilters = {
        'a single condition': { field: 'name', operator: 'equal', value: 'Thisbe' },
        'an and group': {
          aggregator: 'and',
          conditions: [
            { field: 'name', operator: 'starts_with', value: 'Th' },
            { field: 'age', operator: 'greater_than', value: 18 },
          ],
        },
        'an or group': {
          aggregator: 'or',
          conditions: [
            { field: 'name', operator: 'blank', value: null },
            { field: 'active', operator: 'equal', value: true },
          ],
        },
        'nested groups': {
          aggregator: 'and',
          conditions: [
            { field: 'createdAt', operator: 'previous_x_days', value: 7 },
            {
              aggregator: 'or',
              conditions: [
                { field: 'book:title', operator: 'contains', value: 'Utopia' },
                {
                  aggregator: 'and',
                  conditions: [
                    { field: 'id', operator: 'in', value: [1, 2, 3] },
                    { field: 'tags', operator: 'not_contains', value: 'draft' },
                  ],
                },
              ],
            },
          ],
        },
        'a group wrapping the same field as the scope': {
          aggregator: 'and',
          conditions: [{ field: 'team', operator: 'not_equal', value: 'humanist' }],
        },
        'a value holding JSON punctuation': {
          field: 'name', operator: 'equal', value: 'brackets ] [, braces } {, "quotes": yes',
        },
        'unicode and escaped characters': {
          field: 'name', operator: 'contains', value: 'Thisbé "the\\ninth"\n\u2028',
        },
      };

      Object.entries(legitimateFilters).forEach(([shape, filter]) => {
        it(`returns the same combined filter as before for ${shape}`, async () => {
          const serialized = JSON.stringify(filter);

          const combined = await combine(serialized);

          expect(combined).toBe(previouslyCombined(serialized));
          expect(JSON.parse(combined)).toStrictEqual({ aggregator: 'and', conditions: [filter, scope] });
        });
      });

      [
        'after', 'after_x_hours_ago', 'before', 'before_x_hours_ago', 'blank', 'contains',
        'ends_with', 'equal', 'future', 'greater_than', 'in', 'less_than', 'not', 'not_contains',
        'not_equal', 'past', 'present', 'previous_month', 'previous_month_to_date',
        'previous_quarter', 'previous_quarter_to_date', 'previous_week', 'previous_week_to_date',
        'previous_x_days', 'previous_x_days_to_date', 'previous_year', 'previous_year_to_date',
        'starts_with', 'today', 'yesterday',
      ].forEach((operator) => {
        it(`returns the same combined filter as before for the ${operator} operator`, async () => {
          const serialized = JSON.stringify({ field: 'createdAt', operator, value: 'Europe/Paris' });

          const combined = await combine(serialized);

          expect(combined).toBe(previouslyCombined(serialized));
        });
      });

      it('returns the same combined tree as before for a filter sent with whitespace', async () => {
        const serialized = JSON.stringify(legitimateFilters['nested groups'], null, 2);

        const combined = await combine(serialized);

        expect(JSON.parse(combined)).toStrictEqual(JSON.parse(previouslyCombined(serialized)));
      });

      it('nests a filter given as an object under the and group next to the scope', async () => {
        const filter = legitimateFilters['an or group'];

        const combined = await combine(filter);

        expect(JSON.parse(combined)).toStrictEqual({ aggregator: 'and', conditions: [filter, scope] });
      });

      it('always returns an and group of the filter and the scope', async () => {
        expect.hasAssertions();

        const filters = [
          ...Object.values(legitimateFilters).map((filter) => JSON.stringify(filter)),
          'null',
          '42',
          '"Thisbe"',
          '[]',
        ];

        const combinedTrees = await Promise.all(filters
          .map(async (filter) => JSON.parse(await combine(filter))));

        combinedTrees.forEach((tree, index) => {
          expect(tree).toStrictEqual({
            aggregator: 'and',
            conditions: [JSON.parse(filters[index]), scope],
          });
        });
      });

      [
        ['a truncated document', '{"field":"name","operator":"equal"'],
        ['plain text', 'Thisbe'],
        ['whitespace only', '   '],
        ['several JSON values', '{"field":"id","operator":"equal","value":1},{"field":"id","operator":"equal","value":2}'],
      ].forEach(([shape, filter]) => {
        it(`rejects ${shape} with the invalid filters error the parser raises`, async () => {
          expect(() => BaseFiltersParser.parseFiltersString(filter))
            .toThrow(new InvalidFiltersFormat('Invalid filters JSON format'));

          const rejection = combine(filter);

          await expect(rejection).rejects.toThrow(InvalidFiltersFormat);
          await expect(rejection).rejects.toMatchObject({
            name: 'InvalidFiltersFormat',
            message: 'Invalid filters JSON format',
            status: 422,
          });
        });
      });
    });

    it('returns an unparsable filter untouched when no scope applies', async () => {
      const context = makeContext();
      context.forestAdminClient.getScope.mockResolvedValue(null);
      const scopeManager = new ScopeManager(context);

      const newFilter = await scopeManager.appendScopeForUser('Thisbe', defaultUser, 'myCollection');

      expect(newFilter).toBe('Thisbe');
    });

    it('returns undefined for an empty filter when no scope applies', async () => {
      const context = makeContext();
      context.forestAdminClient.getScope.mockResolvedValue(null);
      const scopeManager = new ScopeManager(context);

      const newFilter = await scopeManager.appendScopeForUser('', defaultUser, 'myCollection');

      expect(newFilter).toBeUndefined();
    });

    it('returns the serialized scope for an empty filter', async () => {
      const context = makeContext();
      const scope = { aggregator: 'and', conditions: [{ field: 'id', operator: 'equal', value: 1 }] };
      context.forestAdminClient.getScope.mockResolvedValue(scope);
      const scopeManager = new ScopeManager(context);

      const newFilter = await scopeManager.appendScopeForUser('', defaultUser, 'myCollection');

      expect(newFilter).toBe(JSON.stringify(scope));
    });
  });

  describe('getScopeForUser', () => {
    describe('with bad inputs', () => {
      const context = makeContext();
      const scopeManager = new ScopeManager(context);

      describe('with a user having no renderingId', () => {
        it('should throw an error', async () => {
          await expect(
            scopeManager.getScopeForUser({}, 'myCollection'),
          ).rejects.toStrictEqual(new Error('Missing required renderingId'));
        });
      });

      describe('without providing a collectionName', () => {
        it('should throw an error', async () => {
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
