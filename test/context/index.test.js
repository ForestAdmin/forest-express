const { makeLogger } = require('../../src/context/build-services');

describe('context >  build-services', () => {
  describe('makeLogger', () => {
    it('should create logger with default value (log level Info)', async () => {
      const env = {};
      const logger = {
        info: jest.fn(),
      };

      const internalLogger = makeLogger({ env, logger });

      internalLogger('Info', 'Message');

      expect(logger.info).toHaveBeenCalledOnce();
      expect(logger.info).toHaveBeenCalledWith('Message');
    });

    describe('when FOREST_LOGGER_LEVEL is equal or higher than the actual log level', () => {
      it('should log the message', async () => {
        const env = { FOREST_LOGGER_LEVEL: 'Debug' };
        const logger = {
          debug: jest.fn(),
        };

        const internalLogger = makeLogger({ env, logger });

        internalLogger('Debug', 'Message');

        expect(logger.debug).toHaveBeenCalledOnce();
        expect(logger.debug).toHaveBeenCalledWith('Message');
      });
    });

    describe('when FOREST_LOGGER_LEVEL is lower than the actual log level', () => {
      it('should not log anything', async () => {
        const env = { FOREST_LOGGER_LEVEL: 'Error' };
        const logger = {
          info: jest.fn(),
        };

        const internalLogger = makeLogger({ env, logger });

        internalLogger('Info', 'Message');

        expect(logger.info).not.toHaveBeenCalled();
      });
    });
  });
});
