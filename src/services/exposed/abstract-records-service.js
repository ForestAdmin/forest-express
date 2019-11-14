const ResourceSerializer = require('../../serializers/resource');
const StateManager = require('../state-manager');

class AbstractRecordService {
  constructor(model) {
    this.model = model;
    this.stateManager = StateManager.getInstance();
  }

  get Implementation() {
    return this.stateManager.Implementation;
  }

  get lianaOptions() {
    return this.stateManager.lianaOptions;
  }

  serialize(records) {
    return new ResourceSerializer(
      this.Implementation,
      this.model,
      records,
      this.stateManager.integrator,
      null,
      this.fieldsSearched,
      this.searchValue,
      this.fieldsPerModel,
    ).perform();
  }
}

module.exports = AbstractRecordService;
