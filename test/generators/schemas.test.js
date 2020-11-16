const schemasGenerator = require('../../src/generators/schemas');

describe('generators > schemas', () => {
  it('should build schemas', async () => {
    expect.assertions(2);
    const implementation = {
      SchemaAdapter: async () => ({}),
      getModelName: jest.fn(() => 'model name'),
    };
    const integrator = {
      defineFields: jest.fn(),
      defineSegments: jest.fn(),
    };
    const models = [{}, {}];
    const opts = {};
    await schemasGenerator.perform(implementation, integrator, models, opts);

    expect(integrator.defineFields).toHaveBeenCalledTimes(models.length);
    expect(integrator.defineSegments).toHaveBeenCalledTimes(models.length);
  });
});
