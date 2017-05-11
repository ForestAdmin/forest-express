'use strict';
var _ = require('lodash');
var P = require('bluebird');
var logger = require('../services/logger');

module.exports = function injectSmartFields(record, schema) {

  return P.each(schema.fields, function(field) {
    if (!record[field.field]) {
      if (field.get || field.value) {
        if (field.value) {
          logger.warn('DEPRECATION WARNING: Smart Field value method is ' +
            'deprecated. Please use get method instead.');
        }

        var value = field.get ? field.get(record) : field.value(record);
        console.log(field.field);
        if (value && _.isFunction(value.then)) {
          console.log('----gwegwg -----------------------------------------');
          return value.then(function(value) {
            record[field.field] = value;
          });
        } else {
          console.log(`----------- ${value} --------------------------------`);
          record[field.field] = value;
        }
      } else if (_.isArray(field.type)) {
        record[field.field] = [];
      }
    }
  }).thenReturn(record);
}
