const { find } = require('../../src/utils/data');

describe('utils › data › find', () => {
  it('should find values in data thanks to path', () => {
    expect.assertions(2);
    const data = { foo: { bar: 'baz' } };
    expect(find(data, 'foo')).toStrictEqual({ bar: 'baz' });
    expect(find(data, 'foo.bar')).toStrictEqual('baz');
  });

  it('should return null if path does not match data', () => {
    expect.assertions(1);
    const data = { foo: 'bar' };
    expect(find(data, 'wrong-path')).toBeNull();
  });

  it('should return a falsy data if data is falsy', () => {
    expect.assertions(2);
    expect(find(null, 'valid.path')).toBeNull();
    expect(find(undefined, 'valid.path')).toBeUndefined();
  });
});
