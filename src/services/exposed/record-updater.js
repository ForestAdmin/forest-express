const AbstractRecordService = require('./abstract-records-service');
const ResourceDeserializer = require('../../deserializers/resource');

class RecordUpdater extends AbstractRecordService {
  update(record, recordId) {
    return new this.Implementation.ResourceUpdater(
      this.model, { ...this.params, recordId }, record, this.user,
    )
      .perform();
  }

  deserialize(body) {
    return new ResourceDeserializer(this.Implementation, this.model, body, false)
      .perform();
  }
}

module.exports = RecordUpdater;
