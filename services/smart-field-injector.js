'use strict';
var _ = require('lodash');
var P = require('bluebird');
var logger = require('../services/logger');
var Schemas = require('../generators/schemas');

function setSmartFieldValue(record, field, modelName) {
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
}

module.exports = function injectSmartFields(record, modelName) {
  var schema = Schemas.schemas[modelName];

  return P.each(schema.fields, function (field) {
    if (!record[field.field]) {
      if (field.get || field.value) {
        return setSmartFieldValue(record, field, modelName);
      } else if (_.isArray(field.type)) {
        record[field.field] = [];
      }
    } else if (field.reference) {
      var modelNameAssociation = field.reference.split('.')[0];
      var schemaAssociation = Schemas.schemas[modelNameAssociation];

      if (schemaAssociation && !_.isArray(field.type)) {
        return P.each(schemaAssociation.fields, function (fieldAssociation) {
          if (!record[field.field][fieldAssociation.field] &&
            (fieldAssociation.get || fieldAssociation.value)) {
            return setSmartFieldValue(record[field.field],
              fieldAssociation, modelNameAssociation);
          }
        });
      }
    }
  }).thenReturn(record);
};
