const { init } = require('@forestadmin/context');
const RecordsGetter = require('../../../src/services/exposed/records-getter');
const Schemas = require('../../../src/generators/schemas');
const addressesSchema = require('../../fixtures/addresses-schema');
const usersSchema = require('../../fixtures/users-schema');

init((context) => context);

const collection1 = [{ id: '1', name: 'foo' }, { id: '2', name: 'bar' }, { id: '3', name: 'baz' }];
const collection2 = [{ id: '4', name: 'faa' }, { id: '5', name: 'bor' }, { id: '6', name: 'boz' }];

function getMockedRecordsGetter(modelName = null) {
  const defaultUser = { id: 1, renderingId: 2 };
  const defaultParams = { timezone: 'UTC' };
  const configStore = {
    Implementation: {
      ResourcesGetter() {
        return {
          perform: () => Promise.resolve([collection1, ['id']]),
        };
      },
      HasManyGetter() {
        return {
          perform: () => Promise.resolve([collection2, ['id']]),
        };
      },
      getModelName(model) {
        return model.name;
      },
    },
  };
  const modelsManager = {
    getModelByName(name) {
      return { name };
    },
  };

  return new RecordsGetter(
    { name: modelName },
    defaultUser,
    defaultParams,
    { configStore, modelsManager },
  );
}

function bodyDataAttributes(attributes) {
  return { body: { data: { attributes } } };
}

describe('services › exposed › records-getter', () => {
  describe('getIdsFromRequest', () => {
    it('should return IDs as is if IDs provided', async () => {
      const request = bodyDataAttributes({ ids: ['1', '2'] });
      const ids = await getMockedRecordsGetter('users').getIdsFromRequest(request);
      expect(ids).toStrictEqual(['1', '2']);
    });

    it('should return all records if areAllRecordsSelected === true', async () => {
      Schemas.schemas = { users: usersSchema };

      const request = bodyDataAttributes({ all_records: true });
      const ids = await getMockedRecordsGetter('users').getIdsFromRequest(request);
      expect(ids).toStrictEqual(['1', '2', '3']);
    });

    it('should return all records but some if there are excluded IDs', async () => {
      Schemas.schemas = { users: usersSchema };

      const request = bodyDataAttributes({ all_records_ids_excluded: ['1', '3'] });
      const ids = await getMockedRecordsGetter('users').getIdsFromRequest(request);
      expect(ids).toStrictEqual(['2']);
    });

    it('should return all records if called from related data', async () => {
      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };

      const request = bodyDataAttributes({
        all_records: true,
        parent_collection_name: 'addresses',
        parent_collection_id: '123',
        parent_association_name: 'inhabitant',
      });

      const ids = await getMockedRecordsGetter('users').getIdsFromRequest(request);
      expect(ids).toStrictEqual(['4', '5', '6']);
    });
  });

  describe('getAll', () => {
    it('should return all records', async () => {
      Schemas.schemas = { users: usersSchema };
      const expected = collection1;
      const users = await getMockedRecordsGetter('users').getAll({});
      expect(users).toStrictEqual(expected);
    });
  });
});
