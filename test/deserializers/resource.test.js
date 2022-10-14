const ResourceDeserializer = require('../../src/deserializers/resource');
const Schemas = require('../../src/generators/schemas');
const usersSchema = require('../fixtures/users-schema');

const Implementation = {
  getModelName: (model) => model.name,
};

describe('deserializers > resource', () => {
  Schemas.schemas = { users: usersSchema };

  function getDeserializer(attributes) {
    return new ResourceDeserializer(
      Implementation,
      { name: 'users' },
      { data: { attributes } },
      false,
    );
  }
  it('should return resource properties from request', async () => {
    await expect(getDeserializer({ id: '1' }).perform()).resolves.toStrictEqual({ id: '1' });
    await expect(getDeserializer({ name: 'jane' }).perform()).resolves.toStrictEqual({ name: 'jane', id: undefined });
    await expect(getDeserializer({ id: '1', name: 'john' }).perform()).resolves.toStrictEqual({ id: '1', name: 'john' });
  });

  it('should compute smart field setters and mutate entity', async () => {
    await expect(getDeserializer({ id: '1', name: 'jane', smart: 'doe' }).perform()).resolves
      .toStrictEqual({ id: '1', name: 'jane - doe', smart: 'doe' });
  });
});
