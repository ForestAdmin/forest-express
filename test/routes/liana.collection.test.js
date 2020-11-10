const resetRequireIndex = require('../helpers/reset-index');

describe('liana > collection', () => {
  describe('with an undefined configuration', () => {
    it('should throw an error', async () => {
      expect.assertions(1);
      const forestExpress = resetRequireIndex();

      expect(() => forestExpress.collection()).toThrow(expect.anything());
    });
  });

  describe('with undefined option', () => {
    it('should throw an error', async () => {
      expect.assertions(1);
      const forestExpress = resetRequireIndex();

      expect(() => forestExpress.collection('test')).toThrow(expect.anything());
    });
  });

  describe('with a valid smart collection configuration', () => {
    const config = {
      fields: [{
        field: 'fullNames',
        type: 'String',
      }],
    };

    it('should append collection inside the schema', async () => {
      expect.assertions(1);
      const forestExpress = resetRequireIndex();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      expect(schemas).toHaveProperty('collectionTest');
    });

    it('should exist field inside collection', async () => {
      expect.assertions(1);
      const forestExpress = resetRequireIndex();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      const { collectionTest } = schemas;
      const expectedFields = [{
        field: 'fullNames',
        type: 'String',
        isVirtual: true,
        isFilterable: false,
        isSortable: false,
        isReadOnly: true,
      }];
      expect(collectionTest.fields).toStrictEqual(expectedFields);
    });
  });

  describe('with an empty collection configuration', () => {
    const initSchema = () => {
      const forestExpress = resetRequireIndex();
      forestExpress.Schemas.schemas = {
        collectionTest: {
          name: 'collectionTest',
          fields: [{
            field: 'CollectionTestField',
            type: 'String',
            isVirtual: false,
            isFilterable: true,
            isSortable: true,
            isReadOnly: false,
          }],
        },
      };
      return forestExpress;
    };

    const config = {};

    it('should not append a new collection inside the schema', async () => {
      expect.assertions(1);
      const forestExpress = initSchema();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      expect(Object.keys(schemas)).toStrictEqual(['collectionTest']);
    });

    it('should initialize with empty actions array', async () => {
      expect.assertions(1);
      const forestExpress = initSchema();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      const { collectionTest } = schemas;
      expect(collectionTest.actions).toStrictEqual([]);
    });

    it('should initialize with empty segments array', async () => {
      expect.assertions(1);
      const forestExpress = initSchema();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      const { collectionTest } = schemas;
      expect(collectionTest.segments).toStrictEqual([]);
    });
  });

  describe('with a valid collection configuration', () => {
    const initSchema = () => {
      const forestExpress = resetRequireIndex();
      forestExpress.Schemas.schemas = {
        collectionTest: {
          name: 'collectionTest',
          fields: [{
            field: 'CollectionTestField',
            type: 'String',
            isVirtual: false,
            isFilterable: true,
            isSortable: true,
            isReadOnly: false,
          }],
          actions: [],
          segments: [],
        },
      };
      return forestExpress;
    };

    const config = {
      fields: [{
        field: 'fullNames',
        type: 'String',
      }],
      actions: [{
        name: 'actionTest',
      }],
      segments: [{
        name: 'segmentTest',
      }],
      searchFields: ['fullNames'],
    };

    it('should not append a new collection inside the schema', async () => {
      expect.assertions(1);
      const forestExpress = initSchema();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      expect(Object.keys(schemas)).toStrictEqual(['collectionTest']);
    });

    it('should append collection field', async () => {
      expect.assertions(1);
      const forestExpress = initSchema();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      const { collectionTest } = schemas;
      const expectedFields = [{
        field: 'fullNames',
        type: 'String',
        isVirtual: true,
        isFilterable: false,
        isSortable: false,
        isReadOnly: true,
      }, {
        field: 'CollectionTestField',
        type: 'String',
        isVirtual: false,
        isFilterable: true,
        isSortable: true,
        isReadOnly: false,
      }];
      expect(collectionTest.fields).toStrictEqual(expectedFields);
    });

    it('should append collection action', async () => {
      expect.assertions(1);
      const forestExpress = initSchema();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      const { collectionTest } = schemas;
      const expectedActions = [{
        name: 'actionTest',
      }];
      expect(collectionTest.actions).toStrictEqual(expectedActions);
    });

    it('should append collection segment', async () => {
      expect.assertions(1);
      const forestExpress = initSchema();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      const { collectionTest } = schemas;
      const expectedSegments = [{
        name: 'segmentTest',
      }];
      expect(collectionTest.segments).toStrictEqual(expectedSegments);
    });

    it('should add collection searchFields', async () => {
      expect.assertions(1);
      const forestExpress = initSchema();

      forestExpress.collection('collectionTest', config);

      const { schemas } = forestExpress.Schemas;
      const { collectionTest } = schemas;
      expect(collectionTest.searchFields).toStrictEqual(['fullNames']);
    });
  });

  describe('with an old named collection configuration', () => {
    const spyLogger = () => {
      // eslint-disable-next-line global-require
      const logger = require('../../src/services/logger');
      return { spy: jest.spyOn(logger, 'warn') };
    };

    const initSchema = () => {
      const { forestExpress, spy } = resetRequireIndex(spyLogger);
      forestExpress.Schemas.schemas = {
        collectionTest: {
          name: 'collectionTest',
          nameOld: 'oldCollectionTest',
        },
      };
      return { forestExpress, spy };
    };

    const config = {};

    it('should log a warning', async () => {
      expect.assertions(1);
      const { forestExpress, spy } = initSchema();

      forestExpress.collection('oldCollectionTest', config);
      expect(spy).toHaveBeenCalledWith('DEPRECATION WARNING: Collection names are now based on the models names. Please rename the collection "oldCollectionTest" of your Forest customisation in "collectionTest".');
    });

    it('should not append a new collection inside the schema', async () => {
      expect.assertions(1);
      const { forestExpress } = initSchema();

      forestExpress.collection('oldCollectionTest', config);

      const { schemas } = forestExpress.Schemas;
      expect(Object.keys(schemas)).toStrictEqual(['collectionTest']);
    });
  });
});
