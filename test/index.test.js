const nock = require('nock');

const { v1: uuidv1 } = require('uuid');
const fs = require('fs');
const request = require('supertest');
const express = require('express');

const mockSubscribeToServerEvents = jest.fn().mockResolvedValue();
const options = {};
const mockForestAdminClient = jest.fn().mockReturnValue({
  options,
  subscribeToServerEvents: mockSubscribeToServerEvents,
});

jest.mock('require-all', () => jest.fn());
jest.mock('@forestadmin/forestadmin-client', () => ({
  default: mockForestAdminClient,
}));

function resetRequireIndex(mockExtraModules) {
  jest.resetModules();
  jest.clearAllMocks();

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

  describe('init', () => {
    describe('with an invalid configuration', () => {
      it('should not throw an error', async () => {
        const forestExpress = resetRequireIndex();
        const badConfigDir = new Date();
        const implementation = createFakeImplementation({ configDir: badConfigDir });

        await expect(() => forestExpress.init(implementation)).not.toThrow();
      });
    });

    describe('when requiring all files of the configDir', () => {
      describe('when requireAll() throws an error', () => {
        it('should return a rejected promise', async () => {
          const requireAllMockModule = () => {
            jest.mock('require-all', () => jest.fn().mockImplementation(() => { throw new Error('This is the expected error'); }));
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
          };

          const forestExpress = resetRequireIndex(requireAllMockModule);
          const configDir = './something';
          const implementation = createFakeImplementation({ configDir });

          await expect(() => forestExpress.init(implementation))
            .rejects
            .toThrow('This is the expected error');
        });
      });
    });

    describe('with a valid configuration', () => {
      it('should return a promise', async () => {
        const forestExpress = resetRequireIndex();
        const implementation = createFakeImplementation();

        const app = await forestExpress.init(implementation);

        expect(app).toBeInstanceOf(Function);
      });

      // NOTICE: this test only check for route existence, since a dedicated
      // test exists for healthcheck
      it('should expose a healthcheck route', async () => {
        const forestExpress = resetRequireIndex();
        const implementation = createFakeImplementation();

        const app = await forestExpress.init(implementation);
        const response = await request(app)
          .get('/forest/healthcheck');

        expect(response.status).not.toBe(404);
      });

      it('should build forestAdminClient and change its options', async () => {
        const forestExpress = resetRequireIndex();
        const implementation = createFakeImplementation();

        implementation.opts.envSecret = 'envSecret';
        await forestExpress.init(implementation);

        expect(mockForestAdminClient).toHaveBeenCalledOnce();
        expect(mockForestAdminClient).toHaveBeenCalledWith({
          // Take the value from the environment variable first
          envSecret: undefined,
          forestServerUrl: 'https://api.forestadmin.com',
          logger: expect.any(Function),
          instantCacheRefresh: false,
        });
        // Then updates ForestAdminClient options at runtime
        expect(options).toStrictEqual({
          envSecret: 'envSecret',
        });
      });

      it('should not subscribe to server events', async () => {
        const forestExpress = resetRequireIndex();
        const implementation = createFakeImplementation();

        await forestExpress.init(implementation);

        expect(mockSubscribeToServerEvents).not.toHaveBeenCalledOnce();
      });

      describe('when `Liana.init` is called twice', () => {
        it('should return the same express app', async () => {
          const forestExpress = resetRequireIndex();
          const implementation = createFakeImplementation();

          const app = await forestExpress.init(implementation);
          const anotherApp = await forestExpress.init(implementation);

          expect(app).toStrictEqual(anotherApp);
        });
      });

      describe('when providing an expressParentApp parameter', () => {
        it('should use the generated forest app middleware', async () => {
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
          const app = await initForestAppWithModels();
          const response = await request(app).get('/forest/modelFoo');

          expect(response.status).not.toBe(404);
        });

        it('should attach a csv export route', async () => {
          const app = await initForestAppWithModels();
          const response = await request(app).get('/forest/modelFoo.csv');

          expect(response.status).not.toBe(404);
        });

        it('should attach a records count route', async () => {
          const app = await initForestAppWithModels();
          const response = await request(app).get('/forest/modelFoo/count');

          expect(response.status).not.toBe(404);
        });

        it('should attach a get single record route', async () => {
          const app = await initForestAppWithModels();
          const response = await request(app).get('/forest/modelFoo/1');

          expect(response.status).not.toBe(404);
        });

        it('should attach a create record route', async () => {
          const app = await initForestAppWithModels();
          const response = await request(app).post('/forest/modelFoo');

          expect(response.status).not.toBe(404);
        });

        it('should attach an update record route', async () => {
          const app = await initForestAppWithModels();
          const response = await request(app).put('/forest/modelFoo/1');

          expect(response.status).not.toBe(404);
        });

        it('should attach a remove record route', async () => {
          const app = await initForestAppWithModels();
          const response = await request(app).delete('/forest/modelFoo/1');

          expect(response.status).not.toBe(404);
        });

        it('should attach a remove multiple records route', async () => {
          const app = await initForestAppWithModels();
          const response = await request(app).delete('/forest/modelFoo');

          expect(response.status).not.toBe(404);
        });
      });

      describe('when implementation exposes RequestUnflattener middleware', () => {
        it('should call the middleware on all the routes', async () => {
          const requestUnflattener = jest.fn((req, res, next) => next());
          const fakeImplementation = createFakeImplementation({}, {
            Flattener: {
              requestUnflattener,
            },
          });
          const forestExpress = resetRequireIndex();
          const app = await forestExpress.init(fakeImplementation);

          await request(app).get('/forest/modelFoo');

          expect(requestUnflattener).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('collection', () => {
    describe('with an undefined configuration', () => {
      it('should throw an error', async () => {
        const forestExpress = resetRequireIndex();

        expect(() => forestExpress.collection()).toThrow(expect.anything());
      });
    });

    describe('with undefined option', () => {
      it('should throw an error', async () => {
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
        const forestExpress = resetRequireIndex();

        forestExpress.collection('collectionTest', config);

        const { schemas } = forestExpress.Schemas;
        expect(schemas).toHaveProperty('collectionTest');
      });

      it('should exist field inside collection', async () => {
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

      it('should call field flattener if any', async () => {
        expect.assertions(1);
        const forestExpress = resetRequireIndex();

        class FakeFlattener {
          // eslint-disable-next-line class-methods-use-this
          flattenFields() {
            expect(true).toBeTrue();
          }

          // eslint-disable-next-line class-methods-use-this
          static requestUnflattener(req, res, next) { next(); }
        }

        const fakeImplementation = createFakeImplementation({}, {
          Flattener: FakeFlattener,
        });

        // Used only to initialise Implementation
        await forestExpress.init(fakeImplementation);

        forestExpress.Schemas.schemas.collectionTest = { nameOld: 'collectionTest', name: 'collectionTest' };

        forestExpress.collection('collectionTest', config);
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
        const forestExpress = initSchema();

        forestExpress.collection('collectionTest', config);

        const { schemas } = forestExpress.Schemas;
        expect(Object.keys(schemas)).toStrictEqual(['collectionTest']);
      });

      it('should initialize with empty actions array', async () => {
        const forestExpress = initSchema();

        forestExpress.collection('collectionTest', config);

        const { schemas } = forestExpress.Schemas;
        const { collectionTest } = schemas;
        expect(collectionTest.actions).toStrictEqual([]);
      });

      it('should initialize with empty segments array', async () => {
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
        const forestExpress = initSchema();

        forestExpress.collection('collectionTest', config);

        const { schemas } = forestExpress.Schemas;
        expect(Object.keys(schemas)).toStrictEqual(['collectionTest']);
      });

      it('should append collection field', async () => {
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
        const forestExpress = initSchema();

        forestExpress.collection('collectionTest', config);

        const { schemas } = forestExpress.Schemas;
        const { collectionTest } = schemas;
        expect(collectionTest.searchFields).toStrictEqual(['fullNames']);
      });
    });

    describe('with a collection containing a smart action with the httpMethod property', () => {
      const spyLogger = () => {
        // eslint-disable-next-line global-require
        const logger = require('../src/services/logger');
        return {
          spyOnWarning: jest.spyOn(logger, 'warn'),
          spyOnError: jest.spyOn(logger, 'error'),
        };
      };

      const initSchema = () => {
        const { forestExpress, spyOnWarning, spyOnError } = resetRequireIndex(spyLogger);
        forestExpress.Schemas.schemas = {
          collectionTest: {
            name: 'collectionTest',
          },
        };
        return { forestExpress, spyOnWarning, spyOnError };
      };

      it('should log an error with httpMethod = GET', () => {
        const { forestExpress, spyOnError } = initSchema();

        forestExpress.collection('collectionTest', {
          actions: [{
            name: 'actionTest',
            httpMethod: 'GET',
          }],
        });

        expect(spyOnError).toHaveBeenCalledWith('The "httpMethod" GET of your smart action "actionTest" is not supported. Please update your smart action route to use the POST verb instead, and remove the "httpMethod" property in your forest file.');
      });

      it('should log an error with httpMethod = PUT', () => {
        const { forestExpress, spyOnWarning } = initSchema();

        forestExpress.collection('collectionTest', {
          actions: [{
            name: 'actionTest',
            httpMethod: 'PUT',
          }],
        });

        expect(spyOnWarning).toHaveBeenCalledWith('DEPRECATION WARNING: The "httpMethod" property of your smart action "actionTest" is now deprecated. Please update your smart action route to use the POST verb instead, and remove the "httpMethod" property in your forest file.');
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
        const { forestExpress, spy } = initSchema();

        forestExpress.collection('oldCollectionTest', config);
        expect(spy).toHaveBeenCalledWith('DEPRECATION WARNING: Collection names are now based on the models names. Please rename the collection "oldCollectionTest" of your Forest customisation in "collectionTest".');
      });

      it('should not append a new collection inside the schema', async () => {
        const { forestExpress } = initSchema();

        forestExpress.collection('oldCollectionTest', config);

        const { schemas } = forestExpress.Schemas;
        expect(Object.keys(schemas)).toStrictEqual(['collectionTest']);
      });
    });
  });

  describe('generateAndSendSchema', () => {
    const schemaDir = `/tmp/forest-express-test-${uuidv1()}`;
    const schemaFile = `${schemaDir}/.forestadmin-schema.json`;

    const initForestAppWithModels = async () => {
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
        schemaDir,
      }, {
        getModelName: (model) => model.modelName,
        getLianaName: () => 'forest-implementation',
        getLianaVersion: () => '0.1.2',
        getOrmVersion: () => '2.1.0',
        getDatabaseType: () => 'awesome-sgbd',
        SchemaAdapter: () => Promise.resolve({}),
      });

      return {
        app: await forestExpress.init(implementation),
        forestExpress,
      };
    };

    // eslint-disable-next-line jest/no-hooks
    beforeAll(async () => {
      fs.mkdirSync(schemaDir);
    });

    // eslint-disable-next-line jest/no-hooks
    afterAll(async () => {
      fs.rmdirSync(schemaDir, { recursive: true });
    });

    describe('with a missing ".forestadmin-schema.json" file', () => {
      it('should resolve with "null"', async () => {
        try {
          fs.unlinkSync(schemaFile);
        } catch {
          // NOTICE: Ignore error if missing file, no clean up was needed.
        }

        const { app } = await initForestAppWithModels();

        await expect(app._generateAndSendSchemaPromise).toResolve(null);
      });

      it.todo('should fail properly');
    });

    describe('with an empty ".forestadmin-schema.json" file', () => {
      it('should fail', async () => {
        const emptySchema = '';
        fs.writeFileSync(schemaFile, JSON.stringify(emptySchema));

        const { app } = await initForestAppWithModels();

        await expect(app._generateAndSendSchemaPromise).toResolve(null);
      });
    });

    describe('with an invalid ".forestadmin-schema.json" file', () => {
      it('should resolve with "null"', async () => {
        const invalidSchema = '{ "thisIsWrong": ... }';
        fs.writeFileSync(schemaFile, JSON.stringify(invalidSchema));

        const { app } = await initForestAppWithModels();

        await expect(app._generateAndSendSchemaPromise).toResolve();
      });

      it.todo('should fail properly');
    });

    describe('with a proper ".forestadmin-schema.json" file', () => {
      // eslint-disable-next-line jest/no-hooks
      beforeAll(() => {
        const dummySchema = {
          collections: [],
          meta: {},
        };

        fs.writeFileSync(schemaFile, JSON.stringify(dummySchema));
      });

      it('should be exported for testing purpose', async () => {
        const forestExpress = resetRequireIndex();
        expect(forestExpress.generateAndSendSchema).toBeInstanceOf(Function);
      });

      it('should send apimap only if hash is different on server', async () => {
        const scope = nock('https://api.forestadmin.com')
          .post('/forest/apimaps/hashcheck')
          .reply(200, { sendSchema: true })
          .post('/forest/apimaps')
          .reply(202, { job_id: 42 });

        const { app } = await initForestAppWithModels();

        await app._generateAndSendSchemaPromise;

        expect(scope.isDone()).toBeTrue();
      });

      it('should not send apimap if hash is identical on server', async () => {
        const scope = nock('https://api.forestadmin.com')
          .post('/forest/apimaps/hashcheck')
          .reply(200, { sendSchema: false });

        const { app } = await initForestAppWithModels();

        await app._generateAndSendSchemaPromise;

        expect(scope.isDone()).toBeTrue();
      });
    });
  });
});
