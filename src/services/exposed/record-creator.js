const AbstractRecordService = require('./abstract-records-service');
const ResourceDeserializer = require('../../deserializers/resource');

class RecordCreator extends AbstractRecordService {
  create(record) {
    // Customer code reads related records as stored; only what the agent serves is emptied.
    return new this.Implementation.ResourceCreator(
      this.model,
      this.params,
      record,
      this.user,
      { redactRelatedRecords: false },
    )
      .perform();
  }

  deserialize(body) {
    return new ResourceDeserializer(this.Implementation, this.model, body, true, {
      omitNullAttributes: true,
    })
      .perform();
  }
}

module.exports = RecordCreator;
