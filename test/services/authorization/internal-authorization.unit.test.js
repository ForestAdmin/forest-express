const { transformToRolesIdsGroupByConditions } = require('../../../src/services/authorization/authorization-internal');

describe('authorizationService', () => {
  describe('transformToRolesIdsGroupByConditions', () => {
    it('should return rolesIds group by conditions', () => {
      const condition = {
        value: 'some',
        field: 'definition',
        operator: 'Equal',
      };

      const otherCondition = {
        value: 10,
        field: 'foo',
        operator: 'LessThan',
      };

      const fakeActionConditionsByRoleId = new Map([
        [1, condition],
        [2, condition],
        [3, otherCondition],
      ]);

      const result = transformToRolesIdsGroupByConditions(fakeActionConditionsByRoleId);

      expect(result).toStrictEqual([
        {
          roleIds: [1, 2],
          condition,
        },
        {
          roleIds: [3],
          condition: otherCondition,
        },
      ]);
    });

    it('should return empty array on empty map', () => {
      const fakeActionConditionsByRoleId = new Map();

      const result = transformToRolesIdsGroupByConditions(fakeActionConditionsByRoleId);

      expect(result).toStrictEqual([]);
    });

    it('should return empty array on undefined map', () => {
      const result = transformToRolesIdsGroupByConditions(undefined);

      expect(result).toStrictEqual([]);
    });
  });
});
