class ConfigStore {
  constructor({ logger, fs, path }) {
    this.Implementation = null;
    this.lianaOptions = null;
    this.integrator = null;

    this.logger = logger;
    this.fs = fs;
    this.path = path;
  }

  get modelsDir() {
    return this.lianaOptions && this.lianaOptions.modelsDir;
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
      throw new Error('The use of secretKey and authKey options is deprecated. Please use envSecret and authSecret instead.');
    }

    if (!options.authSecret) {
      throw new Error('Your Forest authSecret seems to be missing. Can you check that you properly set a Forest authSecret in the Forest initialization?');
    }

    if (!options.envSecret) {
      throw new Error('Your Forest envSecret seems to be missing. Can you check that you properly set a Forest envSecret in the Forest initialization?');
    }

    if (options.envSecret.length !== 64) {
      throw new Error('Your Forest envSecret does not seem to be correct. Can you check that you properly copied it in the Forest initialization?');
    }

    if (!this.isConfigDirExist()) {
      this.logger.warn(`The Forest configDir located to "${this.configDir}" not seem to be an existing directory. Can you check that this folder exists?`);
    }

    if (options.onlyCrudModule) {
      this.logger.warn('The use of onlyCrudModule is deprecated. Please remove the option in Forest initialization.');
    }
  }
}

module.exports = ConfigStore;
