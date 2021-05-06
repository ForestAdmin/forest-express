const AbstractRecordService = require('./abstract-records-service');

class RecordRemover extends AbstractRecordService {
  remove(recordId) {
    return new this.Implementation.ResourceRemover(this.model, { recordId }, this.user)
      .perform();
  }
}

module.exports = RecordRemover;
