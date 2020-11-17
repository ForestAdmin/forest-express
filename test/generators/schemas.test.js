const uuidV1 = require('uuid/v1');
const schemasGenerator = require('../../src/generators/schemas');


describe('generators > schemas', () => {
  it('should build schemas', async () => {
    expect.assertions(3);

    const implementation = {
      SchemaAdapter: async () => ({}),
      getModelName: jest.fn(() => 'myModel'),
    };
    const integrator = {
      defineFields: jest.fn(),
      defineSegments: jest.fn(),
    };
    const models = [{}, {}];
    const opts = {};

    schemasGenerator.schemas = {};
    await schemasGenerator.perform(implementation, integrator, models, opts);

    expect(integrator.defineFields).toHaveBeenCalledTimes(models.length);
    expect(integrator.defineSegments).toHaveBeenCalledTimes(models.length);
    expect(schemasGenerator.schemas.myModel).toStrictEqual({
      isSearchable: true, fields: [], actions: [], segments: [],
    });
  });

  it('should merge fields, actions, segments and searchFields when same model is called twice', async () => {
    expect.assertions(5);

    const implementation = {
      SchemaAdapter: async () => ({
        fields: [uuidV1()],
        segments: [uuidV1()],
        actions: [uuidV1()],
        searchFields: [uuidV1()],
      }),
      getModelName: jest.fn(() => 'myModel'),
    };
    const integrator = {
      defineFields: jest.fn(),
      defineSegments: jest.fn(),
    };
    const models = [{}, {}];
    const opts = {};

    schemasGenerator.schemas = {};
    await schemasGenerator.perform(implementation, integrator, models, opts);

    expect(Object.keys(schemasGenerator.schemas)).toHaveLength(1);
    expect(schemasGenerator.schemas.myModel.fields).toHaveLength(2);
    expect(schemasGenerator.schemas.myModel.segments).toHaveLength(2);
    expect(schemasGenerator.schemas.myModel.actions).toHaveLength(2);
    expect(schemasGenerator.schemas.myModel.searchFields).toHaveLength(2);
  });

  it('should not mix models', async () => {
    expect.assertions(9);

    const implementation = {
      SchemaAdapter: async () => ({
        fields: [uuidV1()],
        segments: [uuidV1()],
        actions: [uuidV1()],
        searchFields: [uuidV1()],
      }),
      getModelName: jest.fn(() => uuidV1()),
    };
    const integrator = {
      defineFields: jest.fn(),
      defineSegments: jest.fn(),
    };
    const models = [{}, {}];
    const opts = {};

    schemasGenerator.schemas = {};
    await schemasGenerator.perform(implementation, integrator, models, opts);

    expect(Object.keys(schemasGenerator.schemas)).toHaveLength(2);

    const [firstObjectKey, secondObjectKey] = Object.keys(schemasGenerator.schemas);
    const firstObject = schemasGenerator.schemas[firstObjectKey];
    const secondObject = schemasGenerator.schemas[secondObjectKey];

    expect(firstObject.fields).toHaveLength(1);
    expect(firstObject.segments).toHaveLength(1);
    expect(firstObject.actions).toHaveLength(1);
    expect(firstObject.searchFields).toHaveLength(1);
    expect(secondObject.fields).toHaveLength(1);
    expect(secondObject.segments).toHaveLength(1);
    expect(secondObject.actions).toHaveLength(1);
    expect(secondObject.searchFields).toHaveLength(1);
  });
});
