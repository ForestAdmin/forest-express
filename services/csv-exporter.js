'use strict';
var P = require('bluebird');
var moment = require('moment');
var stringify = require('csv-stringify');
var SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');
var ParamsFieldsDeserializer = require('../deserializers/params-fields');

// NOTICE: Prevent bad date formatting into timestamps.
var CSV_OPTIONS = {
  formatters: {
    date: function (value) { return moment(value).format(); }
  }
};

function CSVExporter(params, response, modelName, recordsExporter) {
  this.perform = function () {
    var filename = params.filename + '.csv';
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-disposition', 'attachment; filename=' +
      filename);
    response.setHeader('Last-Modified', moment());

    // NOTICE: From nginx doc: Setting this to "no" will allow unbuffered
    //         responses suitable for Comet and HTTP streaming applications.
    response.setHeader('X-Accel-Buffering', 'no');
    response.setHeader('Cache-Control', 'no-cache');

    var CSVHeader = params.header + '\n';
    var CSVAttributes = params.fields[modelName].split(',');
    response.write(CSVHeader);

    var fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();

    return recordsExporter
      .perform(function (records) {
        return P
          .map(records, function (record) {
            return new SmartFieldsValuesInjector(record, modelName, fieldsPerModel).perform();
          })
          .then(function (records) {
            return new P(function (resolve) {
              var CSVLines = [];
              records.forEach(function (record) {
                var CSVLine = [];
                CSVAttributes.forEach(function (attribute) {
                  var value;
                  if (params.fields[attribute]) {
                    if (record[attribute]) {
                      if (params.fields[attribute] &&
                        record[attribute][params.fields[attribute]]) {
                        value = record[attribute][params.fields[attribute]];
                      } else {
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

              stringify(CSVLines, CSV_OPTIONS, function(error, csv) {
                response.write(csv);
                resolve();
              });
            });
          });
      })
      .then(function () {
        response.end();
      });
  };
}

module.exports = CSVExporter;
