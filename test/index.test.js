const request = require('supertest');
const express = require('express');

function resetRequireIndex(mockExtraModules) {
  jest.resetModules();

  let modules;
  if (mockExtraModules) {
    modules = mockExtraModules();
  }

  // NOTICE: Since src/index.js is using a singleton like pattern for
  // app, it is require to reset modules import & re-import it on each
  // test. Not calling it would result in `Liana.init` called twice
  // message
  // eslint-disable-next-line global-require
  const forestExpress = require('../src');
  return modules ? { ...modules, forestExpress } : forestExpress;
}

describe('liana > index', () => {
  describe('init', () => {
    const envSecret = Array(65).join('0');
    const authSecret = Array(65).join('1');
    const createFakeImplementation = (extraConfiguration, extraImplementation) => ({
      opts: {
        envSecret,
        authSecret,
        connections: {
          db1: {
            models: {},
          },
        },
        ...extraConfiguration,
      },
      getModelName: (model) => model.modelName,
      getLianaName: () => {},
      getLianaVersion: () => {},
      getOrmVersion: () => {},
      getDatabaseType: () => {},
      ...extraImplementation,
    });

    describe('with an invalid configuration', () => {
      it('should not throw an error', async () => {
        expect.assertions(1);

        const forestExpress = resetRequireIndex();
        const badConfigDir = new Date();
        const implementation = createFakeImplementation({ configDir: badConfigDir });

        await expect(() => forestExpress.init(implementation)).not.toThrow();
      });
    });

    describe('when requiring all files of the configDir', () => {
      describe('when requireAll() throws an error', () => {
        it('should return a rejected promise', async () => {
          expect.assertions(1);

          const expectedErrorMessage = 'This is the expected error';
          const requireAllMockModule = () => {
            jest.mock('require-all');
            /* eslint-disable global-require */
            const requireAll = require('require-all');
            const fs = require('fs');
            /* eslint-enable global-require */
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            requireAll.mockImplementation(() => { throw new Error(expectedErrorMessage); });
          };

          const forestExpress = resetRequireIndex(requireAllMockModule);
          const configDir = './something';
          const implementation = createFakeImplementation({ configDir });

          await expect(() => forestExpress.init(implementation))
            .rejects
            .toThrow(expectedErrorMessage);
        });
      });
    });

    describe('with a valid configuration', () => {
      it('should return a promise', async () => {
        expect.assertions(1);

        const forestExpress = resetRequireIndex();
        const implementation = createFakeImplementation();

        const app = await forestExpress.init(implementation);

        expect(app).toBeInstanceOf(Function);
      });

      // NOTICE: this test only check for route existence, since a dedicated
      // test exists for healthcheck
      it('should expose a healthcheck route', async () => {
        expect.assertions(1);

        const forestExpress = resetRequireIndex();
        const implementation = createFakeImplementation();

        const app = await forestExpress.init(implementation);
        const response = await request(app)
          .get('/forest/healthcheck');

        expect(response.status).not.toStrictEqual(404);
      });

      describe('when `Liana.init` is called twice', () => {
        it('should return the same express app', async () => {
          expect.assertions(1);

          const forestExpress = resetRequireIndex();
          const implementation = createFakeImplementation();

          const app = await forestExpress.init(implementation);
          const anotherApp = await forestExpress.init(implementation);

          expect(app).toStrictEqual(anotherApp);
        });
      });

      describe('when providing an expressParentApp parameter', () => {
        it('should use the generated forest app middleware', async () => {
          expect.assertions(2);

          const forestExpress = resetRequireIndex();
          const expressParentApp = express();
          const useSpy = jest.spyOn(expressParentApp, 'use');
          const implementation = createFakeImplementation({ expressParentApp });

          const app = await forestExpress.init(implementation);

          expect(useSpy).toHaveBeenCalledTimes(1);
          expect(useSpy).toHaveBeenCalledWith('/forest', app);
        });
      });

      describe('when providing an implementation', () => {
        const initForestAppWithModels = () => {
          const forestExpress = resetRequireIndex();
          const implementation = createFakeImplementation({
            connections: {
              db1: {
                models: {
                  modelFoo: {
                    modelName: 'modelFoo',
                  },
                },
              },
            },
          }, {
            getModelName: (model) => model.modelName,
            getLianaName: () => 'forest-implementation',
            getLianaVersion: () => '0.1.2',
            getOrmVersion: () => '2.1.0',
            getDatabaseType: () => 'awesome-sgbd',
            SchemaAdapter: () => Promise.resolve({}),
          });

          return forestExpress.init(implementation);
        };

        // NOTICE: The following request will throw a 401, but are
        // only here to check that a route exists (!404)
        it('should attach a list records route', async () => {
          expect.assertions(1);

          const app = await initForestAppWithModels();
          const response = await request(app).get('/forest/modelFoo');

          expect(response.status).not.toStrictEqual(404);
        });

        it('should attach a csv export route', async () => {
          expect.assertions(1);

          const app = await initForestAppWithModels();
          const response = await request(app).get('/forest/modelFoo.csv');

          expect(response.status).not.toStrictEqual(404);
        });

        it('should attach a records count route', async () => {
          expect.assertions(1);

          const app = await initForestAppWithModels();
          const response = await request(app).get('/forest/modelFoo/count');

          expect(response.status).not.toStrictEqual(404);
        });

        it('should attach a get single record route', async () => {
          expect.assertions(1);

          const app = await initForestAppWithModels();
          const response = await request(app).get('/forest/modelFoo/1');

          expect(response.status).not.toStrictEqual(404);
        });

        it('should attach a create record route', async () => {
          expect.assertions(1);

          const app = await initForestAppWithModels();
          const response = await request(app).post('/forest/modelFoo');

          expect(response.status).not.toStrictEqual(404);
        });

        it('should attach an update record route', async () => {
          expect.assertions(1);

          const app = await initForestAppWithModels();
          const response = await request(app).put('/forest/modelFoo/1');

          expect(response.status).not.toStrictEqual(404);
        });

        it('should attach a remove record route', async () => {
          expect.assertions(1);

          const app = await initForestAppWithModels();
          const response = await request(app).delete('/forest/modelFoo/1');

          expect(response.status).not.toStrictEqual(404);
        });

        it('should attach a remove multiple records route', async () => {
          expect.assertions(1);

          const app = await initForestAppWithModels();
          const response = await request(app).delete('/forest/modelFoo');

          expect(response.status).not.toStrictEqual(404);
        });
      });
    });
  });

  describe('collection', () => {
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
        const logger = require('../src/services/logger');
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
});
