const { getBelongsToAssociations, getHasManyAssociations } = require('../../src/utils/schema');

describe('utils › data', () => {
  describe('getBelongsToAssociations', () => {
    it('should return belongs to associations', () => {
      expect.assertions(1);
      const expected = [{ reference: 'users.id', type: 'String', isVirtual: false }];
      const unexpected = [
        { type: 'String', isVirtual: false },
        { reference: 'something.id', type: ['String'], isVirtual: false },
        { reference: 'something.id', type: ['String'], isVirtual: true },
        {
          reference: 'users.id',
          type: 'String',
          isVirtual: false,
          integration: 'close.io',
        },
      ];
      const result = getBelongsToAssociations({ fields: [...expected, ...unexpected] });
      expect(result).toStrictEqual(expected);
    });
  });

  describe('getHasManyAssociations', () => {
    it('should return belongs to associations', () => {
      expect.assertions(1);
      const expected = [{ reference: 'something.id', type: ['String'], isVirtual: false }];
      const unexpected = [
        { type: 'String', isVirtual: false },
        { reference: 'users.id', type: 'String', isVirtual: false },
        { reference: 'something.id', type: ['String'], isVirtual: true },
        {
          reference: 'users.id',
          type: 'String',
          isVirtual: false,
          integration: 'close.io',
        },
      ];
      const result = getHasManyAssociations({ fields: [...expected, ...unexpected] });
      expect(result).toStrictEqual(expected);
    });
  });
});
