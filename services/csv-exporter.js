'use strict';
var P = require('bluebird');
var moment = require('moment');
var _ = require('lodash');
var SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');

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

    return recordsExporter
      .perform(function (records) {
        return P
          .map(records, function (record) {
            return new SmartFieldsValuesInjector(record, modelName).perform();
          })
          .then(function (records) {
            return new P(function (resolve) {
              var CSVLines = '';
              records.forEach(function (record) {
                var CSVLine = '';
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

                  if (_.isString(value))  {
                    value = '"' + value.replace(/"/g, '""') + '"';
                  }
                  CSVLine += (value || '') + ',';
                });
                CSVLines += CSVLine.slice(0, -1) + '\n';
              });
              response.write(CSVLines);
              resolve();
            });
          });
      })
      .then(function () {
        response.end();
      });
  };
}

module.exports = CSVExporter;
