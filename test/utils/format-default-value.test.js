const formatDefaultValueTest = require('../../src/utils/format-default-value');

describe('utils › formatDefaultValue', () => {
  it('should return stringified boolean', () => {
    expect.assertions(1);

    expect(formatDefaultValueTest('Boolean', true)).toBe('true');
  });

  it('should return stringified Json', () => {
    expect.assertions(1);

    expect(formatDefaultValueTest('Json', { foo: 'bar' })).toBe('{"foo":"bar"}');
  });

  it('should return null Json', () => {
    expect.assertions(1);

    expect(formatDefaultValueTest('Json', null)).toBeNull();
  });
});
