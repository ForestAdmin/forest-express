module.exports = class ModelsManager {
  constructor({ configStore }) {
    this.configStore = configStore;
    this.models = null;
  }

  _flatConnectionsModels() {
    const { connections } = this.configStore.lianaOptions;

    // Should transform connections object to an array containing all models
    // connections => { db1: { models: { model1: {} } }, db2: { models: { model2: {} } } }
    // return [ model1, model2 ]
    return Object.values(connections)
      .reduce((models, connection) => models.concat(Object.values(connection.models)), []);
  }

  _filterModels(models, condition) {
    const { getModelName } = this.configStore.Implementation;

    return models.filter((model) => condition(getModelName(model)));
  }

  _computeModels(models) {
    const { getModelName } = this.configStore.Implementation;

    return models.reduce((computedModels, model) => {
      computedModels[getModelName(model)] = model;
      return computedModels;
    }, {});
  }

  _generateModelList() {
    const { includedModels, excludedModels } = this.configStore.lianaOptions;
    let models = this._flatConnectionsModels();
    const useInclude = includedModels && includedModels.length;
    const useExclude = excludedModels && excludedModels.length;

    if (useInclude) {
      models = this._filterModels(models, (modelName) => includedModels.includes(modelName));
    } else if (useExclude) {
      models = this._filterModels(models, (modelName) => !excludedModels.includes(modelName));
    }

    this.models = this._computeModels(models);
  }

  getModels() {
    if (!this.models) this._generateModelList();
    return this.models;
  }

  getModelByName(name) {
    return this.getModels()[name];
  }
};
