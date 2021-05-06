const AbstractRecordService = require('./abstract-records-service');
const CSVExporter = require('../csv-exporter');

class RecordsExporter extends AbstractRecordService {
  streamExport(response, params) {
    const recordsExporter = new this.Implementation.ResourcesExporter(
      this.model,
      this.lianaOptions,
      params,
      null,
      this.user,
    );
    const modelName = this.Implementation.getModelName(this.model);
    return new CSVExporter(params, response, modelName, recordsExporter)
      .perform();
  }
}

module.exports = RecordsExporter;
