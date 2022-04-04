const P = require('bluebird');
const moment = require('moment');
const stringify = require('csv-stringify');
const { inject } = require('@forestadmin/context');
const ParamsFieldsDeserializer = require('../deserializers/params-fields');
const SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');

// NOTICE: Prevent bad date formatting into timestamps.
const CSV_OPTIONS = {
  formatters: {
    date: (value) => moment(value).format(),
  },
};

function CSVExporter(params, response, modelName, recordsExporter) {
  const { configStore } = inject();

  this.perform = () => {
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

    return recordsExporter
      .perform((records) => P
        .map(records, (record) =>
          new SmartFieldsValuesInjector(record, modelName, fieldsPerModel).perform())
        .then((recordsWithSmartFieldsValues) =>
          new P((resolve) => {
            if (configStore.Implementation.Flattener) {
              recordsWithSmartFieldsValues = configStore.Implementation.Flattener
                .flattenRecordsForExport(modelName, recordsWithSmartFieldsValues);
            }

            const CSVLines = [];
            recordsWithSmartFieldsValues.forEach((record) => {
              const CSVLine = [];
              CSVAttributes.forEach((attribute) => {
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
                CSVLine.push(value || '');
              });
              CSVLines.push(CSVLine);
            });

            stringify(CSVLines, CSV_OPTIONS, (error, csv) => {
              response.write(csv);
              resolve();
            });
          })))
      .then(() => {
        response.end();
      });
  };
}

module.exports = CSVExporter;
