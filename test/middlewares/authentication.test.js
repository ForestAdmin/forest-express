const { ensureAuthenticated, initAuthenticator } = require('../../src/middlewares/authentication');
const context = require('../../src/context');
const initContext = require('../../src/context/init');

describe('middlewares > authentication', () => {
  context.init(initContext);
  const { configStore } = context.inject();
  configStore.lianaOptions = {
    authSecret: 'dummy',
  };

  describe('ensureAuthenticated', () => {
    it('should call next with an error if authenticator is not initialized', async () => {
      expect.assertions(1);

      const next = jest.fn();

      const request = {
        originalUrl: '/non-public-url',
      };

      ensureAuthenticated(request, {}, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with a public route', async () => {
      expect.assertions(1);

      const next = jest.fn();

      const request = {
        originalUrl: '/forest/',
      };

      initAuthenticator();
      ensureAuthenticated(request, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should fail with a request missing authentication', async () => {
      expect.assertions(1);

      const next = jest.fn();

      const request = {
        originalUrl: '/non-public-url',
      };

      initAuthenticator();
      ensureAuthenticated(request, {}, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.toBeString(),
        name: 'Unauthorized',
        status: 401,
      }));
    });
  });

  describe('initAuthenticator', () => {
    it('should return an authenticator', () => {
      expect.assertions(1);

      const authenticator = initAuthenticator();

      expect(authenticator).toBeFunction();
    });
  });
});
