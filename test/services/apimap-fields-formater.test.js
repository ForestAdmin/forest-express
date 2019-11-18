const ApimapFieldsFormater = require('../../src/services/apimap-fields-formater');

describe('services > apimap-fields-formater', () => {
  const fieldsFormated = new ApimapFieldsFormater([{
    field: 'email',
    type: 'String',
  }, {
    field: 'signInCount',
    type: 'Number',
    isFilterable: true,
  }, {
    type: 'Number',
  }], 'Users').perform();

  it('should filter fields without declared "field" attribute', () => {
    expect.assertions(2);
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
});
