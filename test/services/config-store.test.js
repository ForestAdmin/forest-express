const ConfigStore = require('../../src/services/config-store');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('services > config-store', () => {
  const logger = {
    warn: jest.fn(),
    error: jest.fn(),
  };

  const fs = {
    existsSync: jest.fn((directory) => directory.includes('forest')),
  };

  const path = {
    resolve: jest.fn((root, dir) => `${root}/${dir}`),
  };

  const projectDirectoryFinder = {
    getAbsolutePath: jest.fn(() => './forest'),
  };

  const configStore = new ConfigStore({
    logger,
    fs,
    path,
    projectDirectoryFinder,
  });

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

      expect(() => configStore.validateOptions()).toThrow('Your authSecret appears to be missing. Please check it is correctly set in your .env file.');
    });

    it('should log an error when no envSecret is provided', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = { authSecret };

      expect(() => configStore.validateOptions()).toThrow('Your envSecret appears to be missing. Please check it is correctly set in your .env file.');
    });

    it('should log an error when envSecret does not match 64 length requirement', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = { authSecret, envSecret: Array(10).join('1') };

      expect(() => configStore.validateOptions()).toThrow('Your envSecret seems incorrect (64 characters required). Please check it is correctly set in your .env file.');
    });

    it('should log an error when using secretKey and authKey', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        secretKey: envSecret,
        authKey: authSecret,
      };

      expect(() => configStore.validateOptions()).toThrow('secretKey and authKey options are not supported anymore. Please use envSecret and authSecret instead.');
    });

    it('should log an error when no connections are provided', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
      };

      expect(() => configStore.validateOptions()).toThrow('The connections option seems incorrectly set. Please check it is an object of named connections.');
    });

    it('should log an error when connections option is not an object', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: [],
      };

      expect(() => configStore.validateOptions()).toThrow('The connections option seems incorrectly set. Please check it is an object of named connections.');
    });

    it('should log an error when using includedModels as not an array', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: {},
        includedModels: 'error',
      };

      expect(() => configStore.validateOptions()).toThrow('The includedModels option seems incorrectly set. Please check it is an array of model names.');
    });

    it('should log an error when using excludedModels as not an array', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: {},
        excludedModels: 'error',
      };

      expect(() => configStore.validateOptions()).toThrow('The excludedModels option seems incorrectly set. Please check it is an array of model names.');
    });

    it('should log an error when schemaDir does not exist', () => {
      expect.assertions(1);
      jest.clearAllMocks();

      const schemaDir = new Date();
      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: {},
        schemaDir,
      };

      expect(() => configStore.validateOptions()).toThrow(`Your schemaDir ("./${schemaDir}") does not exist. Please make sure it is set correctly.`);
    });
  });

  describe('when the given configuration is valid', () => {
    const validConnections = {
      db1: {
        models: {},
      },
    };

    it('should log a warning when onlyCrudModule is provided', () => {
      expect.assertions(2);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: validConnections,
        onlyCrudModule: true,
      };

      expect(() => configStore.validateOptions()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith('onlyCrudModule is not supported anymore. Please remove this option.');
    });

    it('should log a warning when modelsDir is provided', () => {
      expect.assertions(2);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: validConnections,
        modelsDir: '../models',
      };

      expect(() => configStore.validateOptions()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith('modelsDir is not supported anymore. Please remove this option.');
    });

    it('should log a warning when configDir does not exist', () => {
      expect.assertions(2);
      jest.clearAllMocks();

      const configDir = new Date();
      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: validConnections,
        configDir,
      };

      expect(() => configStore.validateOptions()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(`Your configDir ("./${configDir}") does not exist. Please make sure it is set correctly.`);
    });

    it('should log a warning when includedModels and excludedModels at used in the same time', () => {
      expect.assertions(2);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: validConnections,
        includedModels: [],
        excludedModels: [],
      };

      expect(() => configStore.validateOptions()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith('includedModels and excludedModels options cannot be used simultaneously. Only the includedModels option will be taken into account.');
    });

    it('should log nothing when a valid configuration is provided', () => {
      expect.assertions(2);
      jest.clearAllMocks();

      configStore.lianaOptions = {
        authSecret,
        envSecret,
        connections: validConnections,
        configDir: '../forest',
      };

      expect(() => configStore.validateOptions()).not.toThrow();
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });
  });
});
