const _ = require('lodash');

module.exports = class ModelsManager {
  constructor({ configStore }) {
    this.configStore = configStore;
    this.models = null;
  }

  getModels() {
    if (!this.models) this._generateModelList();
    return this.models;
  }

  _generateModelList() {
    const models = this.configStore.Implementation.getModels();
    _.each(models, (model, modelName) => {
      model.modelName = modelName;
    });

    this.models = models;
  }
};
