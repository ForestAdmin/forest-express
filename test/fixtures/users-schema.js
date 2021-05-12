module.exports = {
  name: 'users',
  idField: 'id',
  primaryKeys: ['id'],
  isCompositePrimary: false,
  fields: [
    {
      field: 'smart',
      type: 'Json',
      get: () => ({ foo: 'bar' }),
      set: (user, value) => {
        user.name = `${user.name} - ${value}`;
        return user;
      },
      isVirtual: true,
      isFilterable: false,
      isSortable: false,
      isReadOnly: true,
      defaultValue: null,
      isRequired: false,
      description: null,
      reference: null,
      inverseOf: null,
      relationships: null,
      enums: null,
      validations: [],
      integration: null,
    },
    {
      field: 'hasAddress',
      type: 'Boolean',
      get: () => true,
      isVirtual: true,
      isFilterable: false,
      isSortable: false,
      isReadOnly: true,
      defaultValue: false,
      isRequired: false,
      description: null,
      reference: null,
      inverseOf: null,
      relationships: null,
      enums: null,
      validations: [],
      integration: null,
    },
    {
      field: 'id',
      type: 'String',
      columnName: 'id',
      primaryKey: true,
      isRequired: true,
      validations: [Array],
      defaultValue: null,
      isReadOnly: false,
      isSortable: true,
      isFilterable: true,
      isVirtual: false,
      description: null,
      reference: null,
      inverseOf: null,
      relationships: null,
      enums: null,
      integration: null,
    },
    {
      field: 'name',
      type: 'String',
      columnName: 'name',
      defaultValue: null,
      isRequired: false,
      isReadOnly: false,
      isSortable: true,
      isFilterable: true,
      isVirtual: false,
      description: null,
      reference: null,
      inverseOf: null,
      relationships: null,
      enums: null,
      validations: [],
      integration: null,
    },
  ],
  isSearchable: true,
  actions: [{
    name: 'Test me',
    type: 'single',
    endpoint: '/forest/actions/test-me',
    httpMethod: 'POST',
    fields: [],
    redirect: null,
    baseUrl: null,
    download: false,
  }],
  segments: [],
  onlyForRelationships: false,
  isVirtual: false,
  isReadOnly: false,
  paginationType: 'page',
  icon: null,
  nameOld: 'users',
  integration: null,
};
