const ResourceSerializer = require('../../serializers/resource');
const context = require('../../context');

class AbstractRecordService {
  constructor(model, user, { configStore, modelsManager } = context.inject()) {
    this.model = model;
    this.user = user;
    this.configStore = configStore;
    this.modelsManager = modelsManager;
  }

  get Implementation() {
    return this.configStore.Implementation;
  }

  get lianaOptions() {
    return this.configStore.lianaOptions;
  }

  get integrator() {
    return this.configStore.integrator;
  }

  serialize(records, meta = null) {
    return new ResourceSerializer(
      this.Implementation,
      this.model,
      records,
      this.integrator,
      meta,
      this.fieldsSearched,
      this.searchValue,
      this.fieldsPerModel,
    ).perform();
  }
}

module.exports = AbstractRecordService;
