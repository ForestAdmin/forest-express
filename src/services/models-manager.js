module.exports = class ModelsManager {
  constructor({ configStore }) {
    this.configStore = configStore;
    this.models = null;
  }

  getModels() {
    if (!this.models) this._generateModelList();
    return this.models;
  }

  _filterModels(models, condition) {
    const { getModelName } = this.configStore.Implementation;

    return Object.values(models).reduce((filteredModels, model) => {
      const modelName = getModelName(model);
      if (condition(modelName)) filteredModels[modelName] = model;
      return filteredModels;
    }, {});
  }

  _generateModelList() {
    const { includedModels, excludedModels, models } = this.configStore.lianaOptions;
    const useInclude = includedModels && includedModels.length;
    const useExclude = excludedModels && excludedModels.length;

    this.models = models;

    if (useInclude) {
      this.models = this._filterModels(models, (modelName) => includedModels.includes(modelName));
    } else if (useExclude) {
      this.models = this._filterModels(models, (modelName) => !excludedModels.includes(modelName));
    }
  }
};
