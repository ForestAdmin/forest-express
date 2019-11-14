const AbstractRecordService = require('./abstract-records-service');

class RecordCounter extends AbstractRecordService {
  count(params) {
    return new this.Implementation.ResourcesGetter(this.model, this.lianaOptions, params)
      .count();
  }
}

module.exports = RecordCounter;
