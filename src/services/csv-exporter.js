const _ = require('lodash');
const P = require('bluebird');
const moment = require('moment');
const stringify = require('csv-stringify');
const SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');
const ParamsFieldsDeserializer = require('../deserializers/params-fields');
const { recursivelyAddSmartValues } = require('../utils/smart-values');


// NOTICE: Prevent bad date formatting into timestamps.
const CSV_OPTIONS = {
  formatters: {
    date: (value) => moment(value).format(),
  },
};

function CSVExporter(params, response, modelName, recordsExporter) {
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
        .then((recordsWithSmartFieldsValues) => {
        // NOTICE: add smart fields inside record for correct further serialization
        //        (will override magic accessor method created by sequelize if same name)
        //         ex: get{Model}s, set{Model}s, add{Model}, add{Model}s, has{Model}, has{Model}s,
        //             count{Model}s, remove{Model}, remove{Model}s, create{Model}
          _.each(recordsWithSmartFieldsValues, (record) => {
            recursivelyAddSmartValues(record);
            const referencesWithSmartValues = Object.keys(record.dataValues)
              .filter((x) => record.dataValues[x].smartValues);
            _.each(referencesWithSmartValues, (reference) =>
              recursivelyAddSmartValues(record[reference]));
          });

          return recordsWithSmartFieldsValues;
        })
        .then((recordsWithSmartFieldsValues) =>
          new P((resolve) => {
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
                CSVLine.push(_.isNil(value) ? '' : value);
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
