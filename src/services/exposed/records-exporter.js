const context = require('../../context');
const CSVExporter = require('../csv-exporter');
const RecordSerializer = require('./record-serializer');

class RecordsExporter extends RecordSerializer {
  constructor(model, user, params, { configStore } = context.inject()) {
    super(model, user, params, { configStore });

    if (!params?.timezone) {
      throw new Error(
        'Since v8.0.0 the RecordsExporter\'s constructor has changed and requires access to the requesting user and query string.\n'
        + 'Please check the migration guide at https://docs.forestadmin.com/documentation/how-tos/maintain/upgrade-notes-sql-mongodb/upgrade-to-v8',
      );
    }
  }

  /**
   * Stream a CSV export of records matching request provided in constructor in the provided
   * express response object.
   */
  streamExport(response) {
    const modelName = this.Implementation.getModelName(this.model);
    const recordsExporter = new this.Implementation
      .ResourcesExporter(this.model, this.lianaOptions, this.params, null, this.user);

    return new CSVExporter(this.params, response, modelName, recordsExporter).perform();
  }
}

module.exports = RecordsExporter;
