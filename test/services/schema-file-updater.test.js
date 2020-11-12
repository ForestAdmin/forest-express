const fs = require('fs');

const logger = require('../../src/services/logger');
const SchemaFileUpdater = require('../../src/services/schema-file-updater');
const SchemaSerializer = require('../../src/serializers/schema');

describe('services > schema-file-updater', () => {
  const fsWriteFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
  const loggerWarnSpy = jest.spyOn(logger, 'warn');

  const meta = {
    database_type: 'some-db-type',
    liana: 'some-liana',
    liana_version: 'some-liana-version',
    engine: 'some-engine',
    engine_version: 'some-engine-version',
    framework: 'some-framework',
    framework_version: 'some-framework-version',
    orm_version: 'some-orm-version',
  };
  const schemaSerializer = new SchemaSerializer();
  const { options: serializerOptions } = schemaSerializer;
  const buildSchema = (collection, metas = meta) =>
    new SchemaFileUpdater('test.json', collection, metas, serializerOptions).perform();

  // NOTICE: Expecting `fs.writeFileSync` second parameter to be valid JSON.
  it('should call fs.writeFileSync with a valid JSON as data', () => {
    expect.assertions(2);
    buildSchema([], {});
    expect(fsWriteFileSyncSpy).toHaveBeenCalledTimes(1);
    const jsonStringSchema = fsWriteFileSyncSpy.mock.calls[0][1];
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
    expect.assertions(2);
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
    const schema = buildSchema([{
      name: 'collectionName',
      actions: [
        { name: 'actionName', type: 'notAnExistingType' },
      ],
    }]);
    expect(schema.collections[0].actions[0].type).toBeNull();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching('Please set a valid Smart Action type'),
    );
  });

  it('should log if action.global=true is still used', () => {
    expect.assertions(1);
    buildSchema([{
      name: 'collectionName',
      actions: [
        { name: 'actionName', global: true },
      ],
    }]);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching('REMOVED OPTION: The support for Smart Action "global" option is now removed'),
    );
  });
});
