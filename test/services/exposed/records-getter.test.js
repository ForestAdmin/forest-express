const context = require('../../../src/context');
const initContext = require('../../../src/context/init');

context.init(initContext);

const RecordsGetter = require('../../../src/services/exposed/records-getter.js');
const Schemas = require('../../../src/generators/schemas');
const usersSchema = require('../../fixtures/users-schema.js');

const collection = [
  { id: '1', name: 'foo' },
  { id: '2', name: 'bar' },
  { id: '3', name: 'baz' },
];

function getMockedRecordsGetter(modelName = null) {
  const recordsGetter = new RecordsGetter(modelName);
  recordsGetter.configStore.Implementation = {
    ResourcesGetter() {
      return {
        perform: () => Promise.resolve([collection, ['id']]),
        count: () => 2,
      };
    },
    getModelName(name) {
      return name;
    },
  };
  return recordsGetter;
}

function bodyDataAttributes(attributes) {
  return { body: { data: { attributes } } };
}

describe('services › exposed › records-getter', () => {
  describe('getIdsFromRequest', () => {
    it('should return IDs as is if IDs provided', async () => {
      expect.assertions(1);
      const expectedIds = ['1', '2'];
      const request = bodyDataAttributes({ ids: expectedIds });
      const ids = await new RecordsGetter().getIdsFromRequest(request);
      expect(ids).toBe(expectedIds);
    });

    it('should return all records if areAllRecordsSelected === true', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema };
      const expectedIds = ['1', '2', '3'];
      const request = bodyDataAttributes({ all_records: true });
      const ids = await getMockedRecordsGetter('users').getIdsFromRequest(request);
      expect(ids).toStrictEqual(expectedIds);
    });

    it('should return all records but some if there are excluded IDs', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema };
      const expectedIds = ['2'];
      const request = bodyDataAttributes({ all_records_ids_excluded: ['1', '3'] });
      const ids = await getMockedRecordsGetter('users').getIdsFromRequest(request);
      expect(ids).toStrictEqual(expectedIds);
    });
  });

  describe('getAll', () => {
    it('should return all records', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema };
      const expected = collection;
      const users = await getMockedRecordsGetter('users').getAll({});
      expect(users).toStrictEqual(expected);
    });
  });
});
