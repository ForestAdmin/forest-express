const ApimapFieldsFormater = require('../../src/services/apimap-fields-formater');

const apimapFieldsFormater = new ApimapFieldsFormater({
  logger: {
    warn: jest.fn(),
  },
});

describe('services > apimap-fields-formater', () => {
  describe('formatFieldsByCollectionName', () => {
    it('should filter fields without declared "field" attribute', () => {
      expect.assertions(2);

      const fieldsFormated = apimapFieldsFormater.formatFieldsByCollectionName(
        [{
          field: 'email',
          type: 'String',
        }, {
          field: 'signInCount',
          type: 'Number',
          isFilterable: true,
        }],
        'Users',
      );

      expect(fieldsFormated).toHaveLength(2);
      expect(fieldsFormated).toStrictEqual([{
        field: 'email',
        type: 'String',
        isVirtual: true,
        isFilterable: false,
        isSortable: false,
        isReadOnly: true,
      }, {
        field: 'signInCount',
        type: 'Number',
        isVirtual: true,
        isFilterable: true,
        isSortable: false,
        isReadOnly: true,
      }]);
    });

    describe('when one of the given fields does not have a field value', () => {
      const fieldsFormated = apimapFieldsFormater.formatFieldsByCollectionName(
        [{
          type: 'String',
        }],
        'Users',
      );

      it('should log a warning message', () => {
        expect.assertions(2);

        expect(apimapFieldsFormater.logger.warn).toHaveBeenCalledTimes(1);
        expect(apimapFieldsFormater.logger.warn).toHaveBeenCalledWith('Bad Smart Field declaration in "Users" collection: missing "field" attribute.');
      });

      it('should not format the field', () => {
        expect.assertions(2);

        expect(fieldsFormated).toHaveLength(0);
        expect(fieldsFormated).toStrictEqual([]);
      });
    });
  });
});
