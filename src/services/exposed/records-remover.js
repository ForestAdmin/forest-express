const AbstractRecordService = require('./abstract-records-service');

class RecordsRemover extends AbstractRecordService {
  remove(ids) {
    return new this.Implementation.ResourcesRemover(this.model, this.params, ids, this.user)
      .perform();
  }
}

module.exports = RecordsRemover;
