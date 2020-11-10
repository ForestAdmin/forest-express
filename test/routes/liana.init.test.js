const request = require('supertest');
const express = require('express');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('liana > init', () => {
  let forestExpress;

  const resetRequireIndex = () => {
    jest.resetModules();
    // NOTICE: Since src/index.js is using a singleton like pattern for
    // app, it is require to reset modules import & re-import it on each
    // test. Not calling it would result in `Liana.init` called twice
    // message
    // eslint-disable-next-line global-require
    forestExpress = require('../../src');
  };

  const createFakeImplementation = (extraConfiguration, extraImplementation) => ({
    opts: {
      envSecret,
      authSecret,
      ...extraConfiguration,
    },
    getModels: () => {},
    getLianaName: () => {},
    getLianaVersion: () => {},
    getOrmVersion: () => {},
    getDatabaseType: () => {},
    ...extraImplementation,
  });

  describe('with an invalid configuration', () => {
    it('should return a rejected promise', async () => {
      expect.assertions(1);

      resetRequireIndex();
      const badConfigDir = new Date();
      const implementation = createFakeImplementation({ configDir: badConfigDir });

      // NOTICE: Should be updated to the correct error
      await expect(() => forestExpress.init(implementation)).rejects.toThrow(expect.anything());
    });
  });

  describe('with a valid configuration', () => {
    it('should return a promise', async () => {
      expect.assertions(1);

      resetRequireIndex();
      const implementation = createFakeImplementation();

      const app = await forestExpress.init(implementation);

      expect(app).toBeInstanceOf(Function);
    });

    // NOTICE: this test only check for route existence, since a dedicated
    // test exists for healthcheck
    it('should expose a healthcheck route', async () => {
      expect.assertions(1);

      resetRequireIndex();
      const implementation = createFakeImplementation();

      const app = await forestExpress.init(implementation);
      const response = await request(app)
        .get('/forest/healthcheck');

      expect(response.status).not.toStrictEqual(404);
    });

    describe('when `Liana.init` is called twice', () => {
      it('should return the same express app', async () => {
        expect.assertions(1);

        resetRequireIndex();
        const implementation = createFakeImplementation();

        const app = await forestExpress.init(implementation);
        const anotherApp = await forestExpress.init(implementation);

        expect(app).toStrictEqual(anotherApp);
      });
    });

    describe('when providing an expressParentApp parameter', () => {
      it('should use the generated forest app middleware', async () => {
        expect.assertions(2);

        resetRequireIndex();
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
        resetRequireIndex();
        const implementation = createFakeImplementation({}, {
          getModels: () => ({
            modelFoo: {
              modelName: 'foo',
            },
          }),
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
        const response = await request(app).get('/forest/modelFoo');

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
