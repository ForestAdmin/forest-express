const RecordsGetter = require('../../../src/services/exposed/records-getter.js');
const Schemas = require('../../../src/generators/schemas');
const usersSchema = require('../../fixtures/users-schema.js');

function getMockedRecordsGetter(modelName = null) {
  const recordsGetter = new RecordsGetter(modelName);
  recordsGetter.configStore.Implementation = {
    ResourcesGetter() {
      return {
        perform: () => Promise.resolve([[
          { id: 1, name: 'foo' },
          { id: 2, name: 'bar' },
        ], ['id']]),
        count: () => 2,
      };
    },
    getModelName(name) {
      return name;
    },
  };
  return recordsGetter;
}

describe('services > exposed > records-getter', () => {
  describe('getIdsFromRequest', () => {
    it('should return IDs as is if IDs provided', async () => {
      expect.assertions(1);
      const expectedIds = [1, 2, 3];
      const request = { body: { data: { attributes: { ids: expectedIds } } } };
      const ids = await new RecordsGetter().getIdsFromRequest(request);
      expect(ids).toBe(expectedIds);
    });
    it('should return all entries if query is provided', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema };
      const expectedIds = [1, 2];
      const request = { query: {} };
      const ids = await getMockedRecordsGetter('users').getIdsFromRequest(request);
      expect(ids).toStrictEqual(expectedIds);
    });
  });
});
