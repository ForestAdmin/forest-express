const ApimapSorter = require('../../src/services/apimap-sorter');

describe('services > apimap-sorter', () => {
  const apimap = {
    meta: {
      orm_version: '4.34.9',
      liana_version: '1.5.24',
      database_type: 'postgresql',
      liana: 'forest-rails',
    },
    data: [{
      id: 'users',
      type: 'collections',
      attributes: {
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'name', type: 'String' },
          { field: 'firstName', type: 'String' },
          { field: 'lastName', type: 'String' },
          { field: 'email', type: 'String' },
          { field: 'url', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
        name: 'users',
      },
    }, {
      id: 'guests',
      type: 'collections',
      attributes: {
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'email', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
        name: 'guests',
      },
    }, {
      type: 'collections',
      id: 'animals',
      attributes: {
        fields: [
          {
            'is-sortable': false, field: 'id', 'is-filterable': false, type: 'Number',
          },
          { type: 'Date', field: 'createdAt' },
          { field: 'updatedAt', type: 'Date' },
        ],
        name: 'animals',
        integration: 'close.io',
        'is-virtual': true,
      },
    }],
    included: [{
      id: 'users.Women',
      type: 'segments',
      attributes: {
        name: 'Women',
      },
    }, {
      id: 'users.import',
      type: 'actions',
      links: {
        self: '/actions',
      },
      attributes: {
        name: 'import',
        fields: [
          {
            isRequired: true,
            type: 'Boolean',
            field: 'Save',
            description: 'save the import file if true.',
            defaultValue: 'true',
          },
          {
            type: 'File',
            field: 'File',
          },
        ],
        'http-method': null,
      },
    }, {
      attributes: {
        name: 'Men',
      },
      id: 'users.Men',
      type: 'segments',
    }, {
      id: 'animals.ban',
      type: 'actions',
      links: {
        self: '/actions',
      },
      attributes: {
        name: 'import',
        global: true,
        download: null,
        endpoint: null,
        redirect: null,
        'http-method': null,
      },
    }],
  };

  const apimapSorted = new ApimapSorter({
    logger: {
      warn: jest.fn(),
    },
  }).sort(apimap);

  it('should sort the apimap sections', () => {
    expect.assertions(1);
    expect(Object.keys(apimapSorted)).toStrictEqual(['data', 'included', 'meta']);
  });

  it('should sort the data collections', () => {
    expect.assertions(1);
    expect(apimapSorted.data.map((collection) => collection.id))
      .toStrictEqual(['animals', 'guests', 'users']);
  });

  it('should sort the data collection values', () => {
    expect.assertions(3);
    expect(Object.keys(apimapSorted.data[0])).toStrictEqual(['type', 'id', 'attributes']);
    expect(Object.keys(apimapSorted.data[1])).toStrictEqual(['type', 'id', 'attributes']);
    expect(Object.keys(apimapSorted.data[2])).toStrictEqual(['type', 'id', 'attributes']);
  });

  it('should sort the data collections attributes values', () => {
    expect.assertions(3);
    expect(Object.keys(apimapSorted.data[0].attributes))
      .toStrictEqual(['name', 'integration', 'is-virtual', 'fields']);
    expect(Object.keys(apimapSorted.data[1].attributes)).toStrictEqual(['name', 'fields']);
    expect(Object.keys(apimapSorted.data[2].attributes)).toStrictEqual(['name', 'fields']);
  });

  it('should sort the data collections attributes fields by name', () => {
    expect.assertions(3);
    expect(apimapSorted.data[0].attributes.fields.map((field) => field.field))
      .toStrictEqual(['createdAt', 'id', 'updatedAt']);
    expect(apimapSorted.data[1].attributes.fields.map((field) => field.field))
      .toStrictEqual(['createdAt', 'email', 'id', 'updatedAt']);
    expect(apimapSorted.data[2].attributes.fields.map((field) => field.field))
      .toStrictEqual(['createdAt', 'email', 'firstName',
        'id', 'lastName', 'name', 'updatedAt', 'url']);
  });

  it('should sort the data collections attributes fields values', () => {
    expect.assertions(1);
    expect(Object.keys(apimapSorted.data[0].attributes.fields[1]))
      .toStrictEqual(['field', 'type', 'is-filterable', 'is-sortable']);
  });

  it('should sort the included actions and segments objects', () => {
    expect.assertions(1);
    expect(apimapSorted.included.map((object) => object.id))
      .toStrictEqual(['animals.ban', 'users.import', 'users.Men', 'users.Women']);
  });

  it('should sort the included actions and segments objects values', () => {
    expect.assertions(4);
    expect(Object.keys(apimapSorted.included[0]))
      .toStrictEqual(['type', 'id', 'attributes', 'links']);
    expect(Object.keys(apimapSorted.included[1]))
      .toStrictEqual(['type', 'id', 'attributes', 'links']);
    expect(Object.keys(apimapSorted.included[2])).toStrictEqual(['type', 'id', 'attributes']);
    expect(Object.keys(apimapSorted.included[3])).toStrictEqual(['type', 'id', 'attributes']);
  });

  it('should sort the included actions and segments objects attributes values', () => {
    expect.assertions(4);
    expect(Object.keys(apimapSorted.included[0].attributes))
      .toStrictEqual(['name', 'download', 'endpoint', 'global', 'http-method', 'redirect']);
    expect(Object.keys(apimapSorted.included[1].attributes))
      .toStrictEqual(['name', 'http-method', 'fields']);
    expect(Object.keys(apimapSorted.included[2].attributes)).toStrictEqual(['name']);
    expect(Object.keys(apimapSorted.included[3].attributes)).toStrictEqual(['name']);
  });

  it('should sort the included action attributes fields by name', () => {
    expect.assertions(1);
    expect(apimapSorted.included[1].attributes.fields.map((field) => field.field))
      .toStrictEqual(['File', 'Save']);
  });

  it('should sort the included action fields values', () => {
    expect.assertions(1);
    expect(Object.keys(apimapSorted.included[1].attributes.fields[1]))
      .toStrictEqual(['field', 'type', 'defaultValue', 'description', 'isRequired']);
  });

  it('should sort the meta values', () => {
    expect.assertions(1);
    expect(Object.keys(apimapSorted.meta))
      .toStrictEqual(['database_type', 'liana', 'liana_version', 'orm_version']);
  });
});
