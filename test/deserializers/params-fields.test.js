const ParamsFieldsDeserializer = require('../../src/deserializers/params-fields');

describe('deserializers > params-fields', () => {
  it('should split commas separated strings into arrays', () => {
    expect.assertions(1);
    const paramsFields = { model: 'field1,field2,field3' };
    const result = (new ParamsFieldsDeserializer(paramsFields)).perform();
    expect(result).toStrictEqual({ model: ['field1', 'field2', 'field3'] });
  });
});
