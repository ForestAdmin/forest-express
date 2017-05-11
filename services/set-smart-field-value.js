'use strict';
var _ = require('lodash');
var logger = require('../services/logger');

module.exports = function setSmartFieldValue(record, field, modelName) {
  if (field.value) {
    logger.warn('DEPRECATION WARNING: Smart Fields "value" method is ' +
      'deprecated. Please use "get" method in your collection ' +
      modelName + ' instead.');
  }

  var value = field.get ? field.get(record) : field.value(record);
  if (value && _.isFunction(value.then)) {
    return value.then(function(result) {
      record[field.field] = result;
    });
  } else {
    record[field.field] = value;
  }
};
