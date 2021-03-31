const { inAppInit } = require('../../src/services/inapp-initialializer');
const context = require('../../src/context');
const initContext = require('../../src/context/init');

describe('services > inapp-initializer', () => {
  context.init(initContext);
  const { configStore } = context.inject();
  configStore.lianaOptions = {
    authSecret: 'dummy',
  };

  describe('inAppInit', () => {
    it('should add routes to app', async () => {
      expect.assertions(2);

      const app = {
        use: jest.fn(),
      };
      const models = {
        connections: Symbol('connections'),
        objectMapping: Symbol('objectMapping'),
      };
      const appDir = '/';
      const init = jest.fn();

      await inAppInit(app, models, appDir, init);

      expect(app.use).toHaveBeenCalledTimes(5);
      expect(init).toHaveBeenCalledWith(expect.objectContaining({
        authSecret: expect.toBeNil(), // Not defined in process.env
        configDir: '/forest/forest',
        connections: models.connections,
        envSecret: expect.toBeNil(), // Not defined in process.env
        objectMapping: models.objectMapping,
      }));
    });
  });
});
