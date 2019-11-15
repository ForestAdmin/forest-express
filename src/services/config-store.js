class ConfigStore {
  static getInstance() {
    if (!ConfigStore.instance) {
      ConfigStore.instance = new ConfigStore();
    }
    return ConfigStore.instance;
  }

  constructor() {
    if (ConfigStore.instance) {
      throw new Error('Singleton ConfigStore has been instantiated twice');
    }
    this.Implementation = null;
    this.lianaOptions = null;
    this.integrator = null;
  }

  get modelsDir() {
    return this.lianaOptions && this.lianaOptions.modelsDir;
  }
}

module.exports = ConfigStore;
