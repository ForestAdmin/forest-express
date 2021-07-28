module.exports = {
  name: 'cars',
  nameOld: 'cars',
  icon: null,
  integration: null,
  isReadOnly: false,
  isSearchable: true,
  isVirtual: false,
  onlyForRelationships: false,
  paginationType: 'page',
  fields: [{
    field: '_id',
    type: 'String',
    defaultValue: null,
    enums: null,
    integration: null,
    isFilterable: true,
    isPrimaryKey: true,
    isReadOnly: false,
    isRequired: false,
    isSortable: true,
    isVirtual: false,
    reference: null,
    inverseOf: null,
    validations: [],
  }, {
    field: 'engine|horsePower',
    type: 'String',
    defaultValue: null,
    enums: null,
    integration: null,
    isFilterable: true,
    isPrimaryKey: false,
    isReadOnly: false,
    isRequired: false,
    isSortable: true,
    isVirtual: false,
    reference: null,
    inverseOf: null,
    validations: [],
  }, {
    field: 'engine|identification|manufacturer',
    type: 'String',
    defaultValue: null,
    enums: null,
    integration: null,
    isFilterable: true,
    isPrimaryKey: false,
    isReadOnly: false,
    isRequired: false,
    isSortable: true,
    isVirtual: false,
    reference: null,
    inverseOf: null,
    validations: [],
  }, {
    field: 'name',
    type: 'String',
    defaultValue: null,
    enums: null,
    integration: null,
    isFilterable: true,
    isPrimaryKey: false,
    isReadOnly: false,
    isRequired: true,
    isSortable: true,
    isVirtual: false,
    reference: null,
    inverseOf: null,
    validations: [{
      message: null,
      type: 'is present',
      value: null,
    }],
  }],
  segments: [],
  actions: [],
};
