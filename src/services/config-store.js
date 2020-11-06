class ConfigStore {
  constructor({ logger, fs, path }) {
    this.Implementation = null;
    this.lianaOptions = null;
    this.integrator = null;

    this.logger = logger;
    this.fs = fs;
    this.path = path;
  }

  get configDir() {
    if (!this.lianaOptions) return null;

    const { configDir } = this.lianaOptions;
    if (configDir) {
      return this.path.resolve('.', `${configDir}`);
    }

    return this.path.resolve('.', 'forest');
  }

  isConfigDirExist() {
    return this.fs.existsSync(this.configDir);
  }

  validateOptions() {
    const options = this.lianaOptions;

    if (!options) {
      throw new Error('Liana options cannot be null.');
    }

    if ((options.secretKey && !options.envSecret) || (options.authKey && !options.authSecret)) {
      throw new Error('secretKey and authKey options are not supported anymore. Please use envSecret and authSecret instead.');
    }

    if (!options.authSecret) {
      throw new Error('Your authSecret appears to be missing. Please check it is correctly set in your .env file.');
    }

    if (!options.envSecret) {
      throw new Error('Your envSecret appears to be missing. Please check it is correctly set in your .env file.');
    }

    if (options.envSecret.length !== 64) {
      throw new Error('Your envSecret seems incorrect (64 characters required). Please check it is correctly set in your .env file.');
    }

    if (!options.models || !options.models.constructor.toString().match('Object')) {
      throw new Error('The toBeDefined option seem to be incorrect. Can you check that the option is an object and contains all models inside in the Forest initialization?');
    }

    if (options.includedModels && !Array.isArray(options.includedModels)) {
      throw new Error('The includedModels option seem to be incorect. Can you check it is an array of model name to includes in the Forest initialization?');
    }

    if (options.excludedModels && !Array.isArray(options.excludedModels)) {
      throw new Error('The excludedModels option seem to be incorect. Can you check it is an array of model name to excludes in the Forest initialization?');
    }

    if (!this.isConfigDirExist()) {
      this.logger.warn(`Your configDir ("${this.configDir}") does not exist. Please make sure it is set correctly.`);
    }

    if (options.onlyCrudModule) {
      this.logger.warn('onlyCrudModule is not supported anymore. Please remove this option.');
    }

    if (options.modelsDir) {
      this.logger.warn('modelsDir is not supported anymore. Please remove this option.');
    }

    if (options.includedModels && options.excludedModels) {
      this.logger.warn('You use includedModels and excludedModels options at the same time. Only the includedModels option goes considered.');
    }
  }
}

module.exports = ConfigStore;
