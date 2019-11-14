class StateManager {
  static getInstance() {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  static get Implementation() {
    return this.getInstance().Implementation;
  }

  static set Implementation(Implementation) {
    this.getInstance().Implementation = Implementation;
  }

  constructor() {
    if (StateManager.instance) {
      throw new Error('Singleton StateManager has been instantiated twice');
    }
    this.Implementation = null;
    this.lianaOptions = null;
    this.integrator = null;
  }

  get modelsDir() {
    return this.lianaOptions && this.lianaOptions.modelsDir;
  }
}

StateManager.instance = null;

module.exports = StateManager;
