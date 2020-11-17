const AbstractRecordService = require('./abstract-records-service');

class RecordSerializer extends AbstractRecordService {
  constructor(model) {
    if (!model) {
      throw new Error('RecordSerializer initialization error: missing first argument "model"');
    }
    if (!(model instanceof Object)) {
      throw new Error('RecordSerializer initialization error: "model" argument should be an object (ex: `{ name: "myModel" }`)');
    }

    if (!model.modelName) {
      model.modelName = model.name;
    }

    super(model);
  }
}

module.exports = RecordSerializer;
