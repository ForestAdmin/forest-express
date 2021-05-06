const AbstractRecordService = require('./abstract-records-service');
const ResourceDeserializer = require('../../deserializers/resource');

class RecordCreator extends AbstractRecordService {
  create(record) {
    return new this.Implementation.ResourceCreator(this.model, record, this.user)
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
