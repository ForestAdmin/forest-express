'use strict';
var _ = require('lodash');
var P = require('bluebird');
var logger = require('../services/logger');
var Schemas = require('../generators/schemas');

function SmartFieldsValuesInjector(record, modelName, fieldsPerModel) {
  var schema = Schemas.schemas[modelName];

  function setSmartFieldValue(record, field, modelName) {
    try {
      var value;
      if (field.value) {
        logger.warn('DEPRECATION WARNING: Smart Fields "value" method is deprecated. Please use ' +
          '"get" method in your collection ' + modelName + ' instead.');
      }

      try {
        value = field.get ? field.get(record) : field.value(record);
      } catch (error) {
        logger.error('Cannot retrieve the ' + field.field + ' value because of an internal error ' +
          'in the getter implementation: ' + error);
      }

      if (value) {
        if (_.isFunction(value.then)) {
          return value
            .then(function (result) {
              record[field.field] = result;
            })
            .catch(function (error) {
              logger.warn('Cannot set the ' + field.field + ' value because of an unexpected ' +
                'error: ' + error);
              return;
            });
        } else {
          record[field.field] = value;
        }
      }
    } catch (error) {
      logger.warn('Cannot set the ' + field.field + ' value because of an unexpected error: ' +
        error);
    }
  }

  function isNotRequestedField(modelName, fieldName) {
    return fieldsPerModel &&
      fieldsPerModel[modelName] &&
      fieldsPerModel[modelName].indexOf(fieldName) === -1;
  }

  this.perform = function () {
    return P.each(schema.fields, function (field) {
      if (!record[field.field]) {
        if (field.get || field.value) {
          if (isNotRequestedField(modelName, field.field)) {
            return;
          }

          return setSmartFieldValue(record, field, modelName);
        } else if (_.isArray(field.type)) {
          record[field.field] = [];
        }
      } else if (field.reference && !_.isArray(field.type)) {
        // NOTICE: Set Smart Fields values to "belongsTo" associated records.
        var modelNameAssociation = field.reference.split('.')[0];
        var schemaAssociation = Schemas.schemas[modelNameAssociation];

        if (schemaAssociation && !_.isArray(field.type)) {
          return P.each(schemaAssociation.fields, function (fieldAssociation) {
            if (isNotRequestedField(field.field, fieldAssociation.field)) {
              return;
            }

            if (!record[field.field][fieldAssociation.field] &&
              (fieldAssociation.get || fieldAssociation.value)) {
              return setSmartFieldValue(record[field.field], fieldAssociation,
                modelNameAssociation);
            }
          });
        }
      }
    }).thenReturn(record);
  };
}

module.exports = SmartFieldsValuesInjector;
