const context = require('../../context');
const ResourceDeserializer = require('../../deserializers/resource');
const ResourceSerializer = require('../../serializers/resource');

class RecordSerializer {
  /** @protected */
  get Implementation() {
    return this.configStore.Implementation;
  }

  /** @protected */
  get lianaOptions() {
    return this.configStore.lianaOptions;
  }

  constructor(model, user = null, params = null, { configStore } = context.inject()) {
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
    this.user = user;
    this.params = params;
    this.configStore = configStore;
  }

  /**
   * Deserialize one record.
   *
   * Unless otherwise specified this method does not deserializes neither relationships nor omits
   * null attributes, which is desired for records that come from update forms.
   *
   * Pass `true` to both parameters for creation forms.
   */
  deserialize(body, withRelationships = false, omitNullAttributes = false) {
    return new ResourceDeserializer(
      this.Implementation,
      this.model,
      body,
      withRelationships,
      { omitNullAttributes },
    ).perform();
  }

  /**
   * Serialize one _or_ multiple records.
   */
  serialize(records, meta = null) {
    return new ResourceSerializer(
      this.Implementation,
      this.model,
      records,
      this.configStore.integrator,
      meta,
    ).perform();
  }
}

module.exports = RecordSerializer;
