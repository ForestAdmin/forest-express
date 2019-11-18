const ResourceSerializer = require('../../serializers/resource');
const ConfigStore = require('../config-store');

class AbstractRecordService {
  constructor(model) {
    this.model = model;
    this.configStore = ConfigStore.getInstance();
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

  serialize(records) {
    return new ResourceSerializer(
      this.Implementation,
      this.model,
      records,
      this.integrator,
      null,
      this.fieldsSearched,
      this.searchValue,
      this.fieldsPerModel,
    ).perform();
  }
}

module.exports = AbstractRecordService;
