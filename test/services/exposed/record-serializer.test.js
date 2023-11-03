const { init } = require('@forestadmin/context');
const RecordSerializer = require('../../../src/services/exposed/record-serializer');
const Schemas = require('../../../src/generators/schemas');
const usersSchema = require('../../fixtures/users-schema');

init((context) => context);

describe('services › exposed › record-serializer', () => {
  describe('when model is not provided', () => {
    it('should throw an error', () => {
      expect(() => new RecordSerializer()).toThrow('RecordSerializer initialization error: missing first argument "model"');
    });
  });

  describe('when model is provided', () => {
    describe('when model is incorrect', () => {
      it('should throw an error', () => {
        expect(() => new RecordSerializer(1)).toThrow('RecordSerializer initialization error: "model" argument should be an object (ex: `{ name: "myModel" }`)');
      });
    });

    describe('when no query is specified', () => {
      it('should compute all the smart fields', async () => {
        Schemas.schemas = { users: usersSchema };
        const modelMock = { name: 'users' };

        const serializer = new RecordSerializer(modelMock, null, null, {
          configStore: {
            Implementation: {
              getModelName: (model) => model.name,
              getLianaName: () => 'forest-express-sequelize',
              getOrmVersion: () => '9.5.0',
            },
            integrator: {},
          },
        });

        const articlesSerialized = await serializer.serialize([{
          hasAddress: true,
          id: '1',
          name: 'foo',
        }]);

        expect(articlesSerialized.data[0].attributes).toContainAllKeys(['hasAddress', 'id', 'name', 'smart']);
      });
    });

    describe('when query is specified', () => {
      describe('when smart field is not specified in query', () => {
        it('should not compute smart field', async () => {
          Schemas.schemas = { users: usersSchema };
          const modelMock = { name: 'users' };
          const queryFields = { fields: { users: 'hasAddress' } };

          const serializer = new RecordSerializer(modelMock, null, queryFields, {
            configStore: {
              Implementation: {
                getModelName: (model) => model.name,
                getLianaName: () => 'forest-express-sequelize',
                getOrmVersion: () => '9.5.0',
              },
              integrator: {},
            },
          });

          const articlesSerialized = await serializer.serialize([{
            hasAddress: true,
            id: '1',
            name: 'foo',
          }]);

          const { attributes } = articlesSerialized.data[0];
          expect(attributes).toContainAllKeys(['hasAddress', 'id', 'name']);
          expect(attributes).not.toContainKey('smart');
        });
      });
      describe('when smart field is specified in query', () => {
        it('should compute smart field', async () => {
          Schemas.schemas = { users: usersSchema };
          const modelMock = { name: 'users' };
          const queryFields = { fields: { users: 'hasAddress,id,smart' } };

          const serializer = new RecordSerializer(modelMock, null, queryFields, {
            configStore: {
              Implementation: {
                getModelName: (model) => model.name,
                getLianaName: () => 'forest-express-sequelize',
                getOrmVersion: () => '9.5.0',
              },
              integrator: {},
            },
          });

          const articlesSerialized = await serializer.serialize([{
            hasAddress: true,
            id: '1',
          }]);

          const { attributes } = articlesSerialized.data[0];
          expect(attributes).toContainAllKeys(['hasAddress', 'smart', 'id']);
          expect(attributes).not.toContainKey('name');
        });
      });
    });
  });
});
