class ConfigStore {
  static getInstance() {
    if (!ConfigStore.instance) {
      ConfigStore.instance = new ConfigStore();
    }
    return ConfigStore.instance;
  }

  static get Implementation() {
    return this.getInstance().Implementation;
  }

  static set Implementation(Implementation) {
    this.getInstance().Implementation = Implementation;
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

ConfigStore.instance = null;

module.exports = ConfigStore;
