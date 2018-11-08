const chai = require('chai');
const chaiSubset = require('chai-subset');
const ApimapFieldsFormater = require('../../src/services/apimap-fields-formater');

const { expect } = chai;
chai.use(chaiSubset);

describe('Service > Apimap Fields Formater', () => {
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
    expect(fieldsFormated.length).equal(2);
    expect(fieldsFormated).to.containSubset([{
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
