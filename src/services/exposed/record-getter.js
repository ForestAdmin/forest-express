const AbstractRecordService = require('./abstract-records-service');

class RecordGetter extends AbstractRecordService {
  get(recordId) {
    return new this.Implementation.ResourceGetter(this.model, { recordId })
      .perform();
  }
}

module.exports = RecordGetter;
