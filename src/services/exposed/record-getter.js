const AbstractRecordService = require('./abstract-records-service');

class RecordGetter extends AbstractRecordService {
  get(recordId) {
    return new this.Implementation.ResourceGetter(
      this.model,
      { ...this.params, recordId },
      this.user,
      // Customer code reads related records as stored; only what the agent serves is emptied.
      { redactRelatedRecords: false },
    )
      .perform();
  }
}

module.exports = RecordGetter;
