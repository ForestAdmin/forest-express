const SchemaFileUpdater = require('../../src/services/schema-file-updater');
const SchemaSerializer = require('../../src/serializers/schema');
const ApplicationContext = require('../../src/context/application-context');

describe('services > schema-file-updater', () => {
  const context = new ApplicationContext();
  context.init((ctx) => ctx
    .addInstance('fs', { writeFileSync: jest.fn() })
    .addInstance('logger', { warn: jest.fn() })
    .addClass(SchemaFileUpdater));

  const meta = {
    liana: 'some-liana',
    liana_version: 'some-liana-version',
    stack: {
      database_type: 'some-db-type',
      engine: 'some-engine',
      engine_version: 'some-engine-version',
      orm_version: 'some-orm-version',
    },
  };
  const schemaSerializer = new SchemaSerializer();
  const { options: serializerOptions } = schemaSerializer;
  const { schemaFileUpdater } = context.inject();
  const buildSchema = (collection, metas = meta) =>
    schemaFileUpdater.update('test.json', collection, metas, serializerOptions);

  // NOTICE: Expecting `fs.writeFileSync` second parameter to be valid JSON.
  it('should call fs.writeFileSync with a valid JSON as data', () => {
    expect.assertions(2);
    const { fs } = context.inject();
    buildSchema([], {});
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const jsonStringSchema = fs.writeFileSync.mock.calls[0][1];
    expect(() => JSON.parse(jsonStringSchema)).not.toThrow();
  });

  it('should format a collection', () => {
    expect.assertions(1);
    const schema = buildSchema([{ name: 'collectionName' }], meta);
    expect(schema.collections[0]).toStrictEqual({
      name: 'collectionName',
      nameOld: 'collectionName',
      icon: null,
      integration: null,
      isReadOnly: false,
      isSearchable: true,
      isVirtual: false,
      onlyForRelationships: false,
      paginationType: 'page',
      fields: [],
      segments: [],
      actions: [],
    });
  });

  it('should format field', () => {
    expect.assertions(2);
    const schema = buildSchema([{
      name: 'collectionName',
      fields: [{
        field: 'fieldA',
        defaultValue: 5,
      }, {
        field: 'fieldB',
        validations: [{
          type: 'is',
          value: 42,
        }],
      }],
    }]);
    expect(schema.collections[0].fields[0]).toStrictEqual({
      field: 'fieldA',
      type: 'String',
      defaultValue: 5,
      enums: null,
      integration: null,
      isFilterable: true,
      isReadOnly: false,
      isRequired: false,
      isPrimaryKey: false,
      isSortable: true,
      isVirtual: false,
      reference: null,
      inverseOf: null,
      validations: [],
    });
    expect(schema.collections[0].fields[1].validations[0]).toMatchObject({
      message: null,
      type: 'is',
      value: 42,
    });
  });

  it('should set field\'s properties', () => {
    expect.assertions(1);
    const schema = buildSchema([{
      name: 'collectionName',
      fields: [{
        field: 'fieldA',
        defaultValue: 5,
        isRequired: true,
        isReadOnly: true,
        isFilterable: false,
        isPrimaryKey: true,
        isSortable: false,
      }],
    }]);
    expect(schema.collections[0].fields[0]).toStrictEqual({
      field: 'fieldA',
      type: 'String',
      defaultValue: 5,
      enums: null,
      integration: null,
      isFilterable: false,
      isReadOnly: true,
      isRequired: true,
      isPrimaryKey: true,
      isSortable: false,
      isVirtual: false,
      reference: null,
      inverseOf: null,
      validations: [],
    });
  });

  it('should format action', () => {
    expect.assertions(3);
    const schema = buildSchema([{
      name: 'collectionName',
      actions: [
        { name: 'actionName', type: 'notAnExistingType' },
        {
          name: 'secondActionName',
          fields: [{
            field: 'someOtherField',
            description: 'This action will \r\n do something',
            enums: ['yes', 'no'],
          }],
        },
        {
          name: 'thirdActionName',
          fields: [{
            field: 'someOtherField',
            description: 'This action will \r\n do something',
            isReadOnly: true,
          }],
        },
      ],
    }]);
    expect(schema.collections[0].actions[0]).toStrictEqual({
      name: 'actionName',
      type: null,
      baseUrl: null,
      endpoint: '/forest/actions/actionname',
      httpMethod: 'POST',
      redirect: null,
      download: false,
      fields: [],
      hooks: { load: false, change: [] },
    });
    expect(schema.collections[0].actions[1].fields[0]).toStrictEqual({
      field: 'someOtherField',
      type: 'String',
      defaultValue: null,
      enums: ['yes', 'no'],
      isRequired: false,
      reference: null,
      description: 'This action will \r\n do something',
      position: 0,
      widget: null,
    });
    expect(schema.collections[0].actions[2].fields[0]).toStrictEqual({
      field: 'someOtherField',
      type: 'String',
      defaultValue: null,
      isRequired: false,
      reference: null,
      description: 'This action will \r\n do something',
      position: 0,
      widget: null,
      enums: null,
      isReadOnly: true,
    });
  });

  it('should format action hooks', () => {
    expect.assertions(6);

    const INVALID_HOOKS = 'Action With Invalid Hooks';
    const INVALID_LOAD_HOOK = 'Action With Invalid Load Hook';
    const INVALID_CHANGE_HOOK = 'Action With Invalid Change Hook';
    const VALID_HOOKS = 'Action With Valid Hooks';
    const VALID_ONLY_LOAD_HOOK = 'Action With Only a Load Hook';
    const VALID_ONLY_CHANGE_HOOK = 'Action With Only a Change Hook';

    const schema = buildSchema([{
      name: 'collectionName',
      actions: [
        {
          name: INVALID_HOOKS,
          type: 'single',
          hooks: { load: 'oops', change: null },
        },
        {
          name: INVALID_LOAD_HOOK,
          type: 'single',
          hooks: { load: 'oops', change: { foo: () => { } } },
        },
        {
          name: INVALID_CHANGE_HOOK,
          type: 'single',
          hooks: { load: () => { }, change: null },
        },
        {
          name: VALID_HOOKS,
          type: 'single',
          hooks: {
            load: () => { },
            change: {
              foo: () => { },
              bar: () => { },
            },
          },
        },
        {
          name: VALID_ONLY_LOAD_HOOK,
          type: 'single',
          hooks: { load: () => { } },
        },
        {
          name: VALID_ONLY_CHANGE_HOOK,
          type: 'single',
          hooks: {
            change: {
              foo: () => { },
              bar: () => { },
            },
          },
        },
      ],
    }]);

    const { actions } = schema.collections[0];
    const findAction = (name) => actions.find((action) => action.name === name);

    expect(findAction(INVALID_HOOKS))
      .toMatchObject({ hooks: { load: false, change: [] } });

    expect(findAction(INVALID_LOAD_HOOK))
      .toMatchObject({ hooks: { load: false, change: ['foo'] } });

    expect(findAction(INVALID_CHANGE_HOOK))
      .toMatchObject({ hooks: { load: true, change: [] } });

    expect(findAction(VALID_HOOKS))
      .toMatchObject({ hooks: { load: true, change: ['foo', 'bar'] } });

    expect(findAction(VALID_ONLY_LOAD_HOOK))
      .toMatchObject({ hooks: { load: true, change: [] } });

    expect(findAction(VALID_ONLY_CHANGE_HOOK))
      .toMatchObject({ hooks: { load: false, change: ['foo', 'bar'] } });
  });

  it('should format segments', () => {
    expect.assertions(1);
    const schema = buildSchema([{
      name: 'collectionName',
      segments: [{ name: 'segmentName' }],
    }]);
    expect(schema.collections[0].segments[0]).toStrictEqual({ name: 'segmentName' });
  });

  it('should not override existing properties', () => {
    expect.assertions(1);
    const schema = buildSchema([{ name: 'collectionName', isVirtual: true }]);
    expect(schema.collections[0]).toMatchObject({
      isVirtual: true,
    });
  });

  it('should contains meta', () => {
    expect.assertions(1);
    const schema = buildSchema([], meta);
    expect(schema.meta).toStrictEqual(meta);
  });

  it('should sort collections by name', () => {
    expect.assertions(2);
    const schema = buildSchema([{ name: 'collectionZ' }, { name: 'collectionA' }]);
    expect(schema.collections[0].name).toStrictEqual('collectionA');
    expect(schema.collections[1].name).toStrictEqual('collectionZ');
  });

  it('should sort fields by field and type', () => {
    expect.assertions(3);
    const schema = buildSchema([{
      name: 'collectionName',
      fields: [{ field: 'fieldZ' }, { field: 'fieldA', type: 'Z' }, { field: 'fieldA', type: 'A' }],
    }]);
    expect(schema.collections[0].fields[0]).toMatchObject({ field: 'fieldA', type: 'A' });
    expect(schema.collections[0].fields[1]).toMatchObject({ field: 'fieldA', type: 'Z' });
    expect(schema.collections[0].fields[2]).toMatchObject({ field: 'fieldZ' });
  });

  it('should sort actions by name', () => {
    expect.assertions(2);
    const schema = buildSchema([{
      name: 'collectionName',
      actions: [{ name: 'actionZ' }, { name: 'actionA' }],
    }]);
    expect(schema.collections[0].actions[0].name).toStrictEqual('actionA');
    expect(schema.collections[0].actions[1].name).toStrictEqual('actionZ');
  });

  it('should set to null invalid action type', () => {
    expect.assertions(2);
    const { logger } = context.inject();
    const schema = buildSchema([{
      name: 'collectionName',
      actions: [
        { name: 'actionName', type: 'notAnExistingType' },
      ],
    }]);
    expect(schema.collections[0].actions[0].type).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching('Please set a valid Smart Action type'),
    );
  });

  it('should log if action.global=true is still used', () => {
    expect.assertions(1);
    const { logger } = context.inject();
    buildSchema([{
      name: 'collectionName',
      actions: [
        { name: 'actionName', global: true },
      ],
    }]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching('REMOVED OPTION: The support for Smart Action "global" option is now removed'),
    );
  });
});
