const moment = require('moment');
// eslint-disable-next-line import/no-unresolved
const { stringify } = require('csv-stringify/sync');
const { inject } = require('@forestadmin/context');
const ParamsFieldsDeserializer = require('../deserializers/params-fields');
const SmartFieldsValuesInjector = require('./smart-fields-values-injector');

// NOTICE: Prevent bad date formatting into timestamps.
const CSV_OPTIONS = {
  cast: {
    date: (value) => moment(value).format(),
  },
};

function CSVExporter(params, response, modelName, recordsExporter) {
  const { configStore } = inject();

  function getValueForAttribute(record, attribute) {
    let value;
    if (params.fields[attribute]) {
      if (record[attribute]) {
        if (params.fields[attribute] && record[attribute][params.fields[attribute]]) {
          value = record[attribute][params.fields[attribute]];
        } else {
          // eslint-disable-next-line
              value = record[attribute].id || record[attribute]._id;
        }
      }
    } else {
      value = record[attribute];
    }

    return value || '';
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  this.perform = async () => {
    const filename = `${params.filename}.csv`;
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-disposition', `attachment; filename=${filename}`);
    response.setHeader('Last-Modified', moment());

    // NOTICE: From nginx doc: Setting this to "no" will allow unbuffered
    //         responses suitable for Comet and HTTP streaming applications.
    response.setHeader('X-Accel-Buffering', 'no');
    response.setHeader('Cache-Control', 'no-cache');

    const CSVHeader = `${params.header}\n`;
    const CSVAttributes = params.fields[modelName].split(',');
    response.write(CSVHeader);

    const fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();

    await recordsExporter
      .perform(async (records) => {
        await Promise.all(
          // eslint-disable-next-line max-len
          records.map((record) => new SmartFieldsValuesInjector(record, modelName, fieldsPerModel).perform()),
        );

        if (configStore.Implementation.Flattener) {
          records = configStore.Implementation.Flattener
            .flattenRecordsForExport(modelName, records);
        }

        records.forEach((record) => {
          // eslint-disable-next-line max-len
          response.write(stringify([CSVAttributes.map((attribute) => getValueForAttribute(record, attribute, params))], CSV_OPTIONS));
        });
      });
    response.end();
  };
}

module.exports = CSVExporter;
