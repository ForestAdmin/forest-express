const ConfigStore = require('../../src/services/config-store');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('services > config-store', () => {
  const logger = {
    warn: jest.fn(),
    error: jest.fn(),
  };

  const fs = {
    existsSync: jest.fn((dir) => dir.includes('forest')),
  };

  const path = {
    resolve: jest.fn((root, dir) => `${root}/${dir}`),
  };

  const configStore = new ConfigStore({ logger, fs, path });

  describe('when the given configuration is invalid', () => {
    it('should log an error when no options are provided', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = null;

      expect(() => configStore.validateOptions()).toThrow('Liana options cannot be null.');
    });

    it('should log an error when no authSecret is provided', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = {};

      expect(() => configStore.validateOptions()).toThrow('Your Forest authSecret seems to be missing. Can you check that you properly set a Forest authSecret in the Forest initialization?');
    });

    it('should log an error when no envSecret is provided', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = { authSecret };

      expect(() => configStore.validateOptions()).toThrow('Your Forest envSecret seems to be missing. Can you check that you properly set a Forest envSecret in the Forest initialization?');
    });

    it('should log an error when envSecret does not match 64 length requirement', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = { authSecret, envSecret: Array(10).join('1') };

      expect(() => configStore.validateOptions()).toThrow('Your Forest envSecret does not seem to be correct. Can you check that you properly copied it in the Forest initialization?');
    });

    it('should log an error when using secretKey and authKey', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        secretKey: envSecret,
        authKey: authSecret,
      };

      expect(() => configStore.validateOptions()).toThrow('The use of secretKey and authKey options is deprecated. Please use envSecret and authSecret instead.');
    });
  });

  describe('when the given configuration is valid', () => {
    it('should log a warning when onlyCrudModule is provided', () => {
      expect.assertions(2);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        onlyCrudModule: true,
      };

      expect(() => configStore.validateOptions()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith('The use of onlyCrudModule is deprecated. Please remove the option in Forest initialization.');
    });

    it('should log a warning when configDir does not exist', () => {
      expect.assertions(2);
      jest.clearAllMocks();

      const configDir = new Date();
      configStore.lianaOptions = {
        authSecret,
        envSecret,
        configDir,
      };

      expect(() => configStore.validateOptions()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(`The Forest configDir located to "./${configDir}" not seem to be an existing directory. Can you check that this folder exists?`);
    });

    it('should log nothing when a valid configuration is provided', () => {
      expect.assertions(2);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        configDir: '../forest',
      };

      expect(() => configStore.validateOptions()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });
  });
});
