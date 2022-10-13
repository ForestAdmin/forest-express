const ParamsFieldsDeserializer = require('../../src/deserializers/params-fields');

describe('deserializers > params-fields', () => {
  it('should split commas separated strings into arrays', () => {
    const paramsFields = { model: 'field1,field2,field3' };
    const expectedResult = { model: ['field1', 'field2', 'field3'] };
    const actualResult = (new ParamsFieldsDeserializer(paramsFields)).perform();

    expect(actualResult).toStrictEqual(expectedResult);
  });
});
