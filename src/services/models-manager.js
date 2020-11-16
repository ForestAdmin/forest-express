module.exports = class ModelsManager {
  constructor({ configStore }) {
    this.configStore = configStore;
    this.models = null;
  }

  _flatConnectionsModels() {
    const { connections } = this.configStore.lianaOptions;

    return Object.values(connections)
      .reduce((models, connection) => models.concat(connection.models), []);
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
    console.log(models);
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
};
