const ResourceDeserializer = require('../../src/deserializers/resource');
const Schemas = require('../../src/generators/schemas');
const usersSchema = require('../fixtures/users-schema.js');

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
    expect.assertions(3);
    expect(await getDeserializer({ id: '1' }).perform()).toStrictEqual({ id: '1' });
    expect(await getDeserializer({ name: 'jane' }).perform()).toStrictEqual({ name: 'jane', id: undefined });
    expect(await getDeserializer({ id: '1', name: 'john' }).perform()).toStrictEqual({ id: '1', name: 'john' });
  });

  it('should compute smart field setters and mutate entity', async () => {
    expect.assertions(1);
    expect(await getDeserializer({ id: '1', name: 'jane', smart: 'doe' }).perform())
      .toStrictEqual({ id: '1', name: 'jane - doe', smart: 'doe' });
  });
});
