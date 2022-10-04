const AbstractRecordService = require('./abstract-records-service');

class RecordCounter extends AbstractRecordService {
  count() {
    return new this.Implementation.ResourcesGetter(
      this.model,
      this.lianaOptions,
      this.params,
      this.user,
    )
      .count();
  }
}

module.exports = RecordCounter;
