class ConfigStore {
  constructor({
    logger,
    fs,
    path,
    projectDirectoryFinder,
  }) {
    this.Implementation = null;
    this.lianaOptions = null;
    this.integrator = null;

    this.logger = logger;
    this.fs = fs;
    this.path = path;
    this.projectDirectoryFinder = projectDirectoryFinder;
  }

  get configDir() {
    if (!this.lianaOptions) return null;

    const { configDir } = this.lianaOptions;
    if (configDir) {
      return this.path.resolve('.', `${configDir}`);
    }

    return this.path.resolve('.', 'forest');
  }

  get schemaDir() {
    const schemaDir = this.lianaOptions?.schemaDir;
    if (schemaDir) {
      return this.path.resolve('.', `${schemaDir}`);
    }

    return this.path.resolve('.', this.projectDirectoryFinder.getAbsolutePath());
  }

  doesConfigDirExist() {
    return this.fs.existsSync(this.configDir);
  }

  doesSchemaDirExist() {
    return this.fs.existsSync(this.schemaDir);
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

    if (!options.connections || !options.connections.constructor.toString().match('Object')) {
      throw new Error('The connections option seems incorrectly set. Please check it is an object of named connections.');
    }

    if (options.includedModels && !Array.isArray(options.includedModels)) {
      throw new Error('The includedModels option seems incorrectly set. Please check it is an array of model names.');
    }

    if (options.excludedModels && !Array.isArray(options.excludedModels)) {
      throw new Error('The excludedModels option seems incorrectly set. Please check it is an array of model names.');
    }

    if (!this.doesConfigDirExist()) {
      this.logger.warn(`Your configDir ("${this.configDir}") does not exist. Please make sure it is set correctly.`);
    }

    if (!this.doesSchemaDirExist()) {
      this.logger.warn(`Your schemaDir ("${this.schemaDir}") does not exist. Please make sure it is set correctly.`);
    }

    if (options.onlyCrudModule) {
      this.logger.warn('onlyCrudModule is not supported anymore. Please remove this option.');
    }

    if (options.modelsDir) {
      this.logger.warn('modelsDir is not supported anymore. Please remove this option.');
    }

    if (options.includedModels && options.excludedModels) {
      this.logger.warn('includedModels and excludedModels options cannot be used simultaneously. Only the includedModels option will be taken into account.');
    }
  }
}

module.exports = ConfigStore;
