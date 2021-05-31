const AbstractRecordService = require('./abstract-records-service');
const CSVExporter = require('../csv-exporter');

class RecordsExporter extends AbstractRecordService {
  streamExport(response) {
    const recordsExporter = new this.Implementation.ResourcesExporter(
      this.model,
      this.lianaOptions,
      this.params,
      null,
      this.user,
    );
    const modelName = this.Implementation.getModelName(this.model);
    return new CSVExporter(this.params, response, modelName, recordsExporter)
      .perform();
  }
}

module.exports = RecordsExporter;
