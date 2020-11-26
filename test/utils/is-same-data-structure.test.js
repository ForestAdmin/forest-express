const isSameDataStructure = require('../../src/utils/is-same-data-structure');

describe('utils › isSameDataStructure', () => {
  describe('when using no level of deepness', () => {
    it('should return true when objects as same keys', () => {
      expect.assertions(2);

      expect(isSameDataStructure({ a: 'b', c: 'd' }, { a: 'e', c: null })).toBe(true);
      expect(isSameDataStructure({ a: 'b', c: { g: 'h' } }, { a: 'e', c: { i: null } })).toBe(true);
    });

    it('should return false when objects does not have the same keys', () => {
      expect.assertions(6);

      expect(isSameDataStructure({ a: 'b', c: 'd' }, { a: 'e', z: null })).toBe(false);
      expect(isSameDataStructure({ a: 'b', c: 'd' }, { a: 'e' })).toBe(false);
      expect(isSameDataStructure({ c: 'd' }, { a: 'e', z: 'f' })).toBe(false);
      expect(isSameDataStructure({ c: 'd' }, { a: 'e' })).toBe(false);
      expect(isSameDataStructure({ c: { d: 'e' } }, { a: { d: null } })).toBe(false);
      expect(isSameDataStructure(null, { a: 'a' })).toBe(false);
    });
  });
  describe('when using a level of deepness', () => {
    it('should return true when objects as same keys', () => {
      expect.assertions(2);

      expect(isSameDataStructure(
        { a: { b: 'c' }, d: { e: 'f' } },
        { a: { b: 'g' }, d: { e: null } },
        1,
      )).toBe(true);

      expect(isSameDataStructure(
        { a: { b: { d: { e: 'f' } } } },
        { a: { b: { d: { e: 'g' } } } },
        3,
      )).toBe(true);
    });

    it('should return false when objects does not have the same keys', () => {
      expect.assertions(4);

      expect(isSameDataStructure(
        { a: { b: 'c' }, d: { e: 'f' } },
        { a: { b: 'g' }, d: { foo: null } },
        1,
      )).toBe(false);
      expect(isSameDataStructure(
        { a: { b: 'c' }, d: { e: 'f' } },
        { a: { b: 'g' }, d: {} },
        1,
      )).toBe(false);
      expect(isSameDataStructure(
        { a: { b: 'c' }, d: { e: 'f' } },
        { a: { b: 'g' }, d: { e: 'f', h: 'i' } },
        1,
      )).toBe(false);
      expect(isSameDataStructure(
        { a: { b: { d: { e: 'f' } } } },
        { a: { b: { d: { g: null } } } },
        3,
      )).toBe(false);
    });
  });
});
