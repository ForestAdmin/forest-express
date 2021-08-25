const ResourceSerializer = require('../../serializers/resource');
const context = require('../../context');

class RecordSerializer {
  constructor(model, user, query, { configStore } = context.inject()) {
    // user and query parameters are kept for retro-compatibility for v8.
    // Should be dropped when releasing the next major.
    if (!model) {
      throw new Error('RecordSerializer initialization error: missing first argument "model"');
    }
    if (!(model instanceof Object)) {
      throw new Error('RecordSerializer initialization error: "model" argument should be an object (ex: `{ name: "myModel" }`)');
    }
    if (!model.modelName) {
      model.modelName = model.name;
    }

    this.model = model;
    this.configStore = configStore;
  }

  serialize(records, meta = null) {
    return new ResourceSerializer(
      this.configStore.Implementation,
      this.model,
      records,
      this.configStore.integrator,
      meta,
    ).perform();
  }
}

module.exports = RecordSerializer;
