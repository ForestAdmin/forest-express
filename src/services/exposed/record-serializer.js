const AbstractRecordService = require('./abstract-records-service');

class RecordSerializer extends AbstractRecordService {
  constructor(model) {
    if (!model) {
      throw new Error('Missing required parameters `model` passed to constructor');
    }
    if (!(model instanceof Object)) {
      throw new Error('Parameter passed to RecordSerializer constructor should be an object (ex: `{ name: "myModel" }`)');
    }
    if (!model.modelName) {
      model.modelName = model.name;
    }
    super(model);
  }
}

module.exports = RecordSerializer;
