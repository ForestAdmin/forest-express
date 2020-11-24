const objectsHaveSameKeys = require('../../src/utils/objects-have-same-keys');

describe('utils › objectsHaveSameKeys', () => {
  it('should return true when objects as same keys', () => {
    expect.assertions(1);

    expect(objectsHaveSameKeys({ a: 'b', c: 'd' }, { a: 'e', c: 'f' })).toBe(true);
  });

  it('should return false when objects does not have the same keys', () => {
    expect.assertions(4);

    expect(objectsHaveSameKeys({ a: 'b', c: 'd' }, { a: 'e', z: 'f' })).toBe(false);
    expect(objectsHaveSameKeys({ a: 'b', c: 'd' }, { a: 'e' })).toBe(false);
    expect(objectsHaveSameKeys({ c: 'd' }, { a: 'e', z: 'f' })).toBe(false);
    expect(objectsHaveSameKeys({ c: 'd' }, { a: 'e' })).toBe(false);
  });
});
