const AbstractRecordService = require('./abstract-records-service');

class RecordsRemover extends AbstractRecordService {
  remove(ids) {
    return new this.Implementation.ResourcesRemover(this.model, ids, this.lianaOptions, this.user)
      .perform();
  }
}

module.exports = RecordsRemover;
