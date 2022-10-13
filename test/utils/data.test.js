const { find } = require('../../src/utils/data');

describe('utils › data › find', () => {
  it('should find values in data thanks to path', () => {
    const data = { foo: { bar: 'baz' } };
    expect(find(data, 'foo')).toStrictEqual({ bar: 'baz' });
    expect(find(data, 'foo.bar')).toBe('baz');
  });

  it('should return null if path does not match data', () => {
    const data = { foo: 'bar' };
    expect(find(data, 'wrong-path')).toBeNull();
  });

  it('should return a falsy data if data is falsy', () => {
    expect(find(null, 'valid.path')).toBeNull();
    expect(find(undefined, 'valid.path')).toBeUndefined();
  });
});
