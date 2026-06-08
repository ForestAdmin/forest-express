const ParamsFieldsDeserializer = require('../../src/deserializers/params-fields');

describe('deserializers > params-fields', () => {
  it('should split commas separated strings into arrays', () => {
    const paramsFields = { model: 'field1,field2,field3' };
    const expectedResult = { model: ['field1', 'field2', 'field3'] };
    const actualResult = (new ParamsFieldsDeserializer(paramsFields)).perform();

    expect(actualResult).toStrictEqual(expectedResult);
  });

  it('should keep already-array values (e.g. composite primary keys)', () => {
    const paramsFields = { dailySpecials: ['dayOfWeek', 'restaurantId'] };
    const expectedResult = { dailySpecials: ['dayOfWeek', 'restaurantId'] };
    const actualResult = (new ParamsFieldsDeserializer(paramsFields)).perform();

    expect(actualResult).toStrictEqual(expectedResult);
  });

  it('should re-split and flatten comma separated entries inside an array', () => {
    const paramsFields = { model: ['field1,field2', 'field3'] };
    const expectedResult = { model: ['field1', 'field2', 'field3'] };
    const actualResult = (new ParamsFieldsDeserializer(paramsFields)).perform();

    expect(actualResult).toStrictEqual(expectedResult);
  });

  it('should return null when paramsFields is not provided', () => {
    expect((new ParamsFieldsDeserializer(undefined)).perform()).toBeNull();
  });
});
