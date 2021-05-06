const AbstractRecordService = require('./abstract-records-service');

class RecordGetter extends AbstractRecordService {
  get(recordId) {
    return new this.Implementation.ResourceGetter(this.model, { recordId }, this.user)
      .perform();
  }
}

module.exports = RecordGetter;
