const {
  getBelongsToAssociations,
  getField,
  getFieldType,
  getHasManyAssociations,
  getSmartField,
  isSmartField,
} = require('../../src/utils/schema');

describe('utils › data', () => {
  describe('getBelongsToAssociations', () => {
    it('should return belongs to associations', () => {
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

  describe('getField', () => {
    describe('with a simple field', () => {
      it('should return the field', () => {
        const fieldToFind = {
          field: 'childs',
          type: 'String',
        };
        const schemas = {
          fields: [{
            field: 'another',
            type: 'Number',
          }, fieldToFind],
        };

        expect(getField(schemas, 'childs')).toStrictEqual(fieldToFind);
      });
    });

    describe('with a reference field', () => {
      it('should return the field', () => {
        const fieldToFind = {
          field: 'childs',
          type: 'String',
          reference: 'Jedi',
        };
        const schemas = {
          fields: [{
            field: 'another',
            type: 'Number',
          }, fieldToFind],
        };

        expect(getField(schemas, 'childs:name')).toStrictEqual(fieldToFind);
      });
    });
  });

  describe('getSmartField', () => {
    describe('when field is not found', () => {
      it('should return null', () => {
        const schema = { fields: [] };

        expect(getSmartField(schema, 'notExisting')).toBeNull();
      });
    });
  });

  describe('isSmartField', () => {
    describe('with a virtual field', () => {
      it('should return true', () => {
        const fieldToFind = {
          field: 'childs',
          type: 'String',
          isVirtual: true,
        };
        const schemas = { fields: [fieldToFind] };

        expect(isSmartField(schemas, 'childs')).toBeTrue();
      });
    });

    describe('with a simple field', () => {
      it('should return false', () => {
        const fieldToFind = {
          field: 'childs',
          type: 'String',
          isVirtual: false,
        };
        const schemas = { fields: [fieldToFind] };

        expect(isSmartField(schemas, 'childs')).toBeFalse();
      });
    });
  });

  describe('getFieldType', () => {
    it('should return the type of the field', () => {
      const schemas = {
        fields: [{
          field: 'childs',
          type: 'String',

        }, {
          field: 'count',
          type: 'Number',
        }],
      };

      expect(getFieldType(schemas, 'childs')).toBe('String');
      expect(getFieldType(schemas, 'count')).toBe('Number');
    });
  });
});
