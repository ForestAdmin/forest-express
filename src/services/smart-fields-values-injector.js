
const _ = require('lodash');
const P = require('bluebird');
const logger = require('../services/logger');
const Schemas = require('../generators/schemas');

function SmartFieldsValuesInjector(record, modelName) {
  const schema = Schemas.schemas[modelName];

  function setSmartFieldValue(record, field, modelName) {
    try {
      let value;
      if (field.value) {
        logger.warn(`${'DEPRECATION WARNING: Smart Fields "value" method is deprecated. Please use ' +
          '"get" method in your collection '}${modelName} instead.`);
      }

      try {
        value = field.get ? field.get(record) : field.value(record);
      } catch (error) {
        logger.error(`Cannot retrieve the ${field.field} value because of an internal error ` +
          `in the getter implementation: ${error}`);
      }

      if (value) {
        if (_.isFunction(value.then)) {
          return value
            .then((result) => {
              record[field.field] = result;
            })
            .catch(() => { });
        }
        record[field.field] = value;
      }
    } catch (error) {
      logger.warn(`Cannot set the ${field.field} value because of an unexpected error: ${
        error}`);
    }
  }

  this.perform = function () {
    return P.each(schema.fields, (field) => {
      if (!record[field.field]) {
        if (field.get || field.value) {
          return setSmartFieldValue(record, field, modelName);
        } else if (_.isArray(field.type)) {
          record[field.field] = [];
        }
      } else if (field.reference && !_.isArray(field.type)) {
        // NOTICE: Set Smart Fields values to "belongsTo" associated records.
        const modelNameAssociation = field.reference.split('.')[0];
        const schemaAssociation = Schemas.schemas[modelNameAssociation];

        if (schemaAssociation && !_.isArray(field.type)) {
          return P.each(schemaAssociation.fields, (fieldAssociation) => {
            if (!record[field.field][fieldAssociation.field] &&
              (fieldAssociation.get || fieldAssociation.value)) {
              return setSmartFieldValue(
                record[field.field], fieldAssociation,
                modelNameAssociation,
              );
            }
          });
        }
      }
    }).thenReturn(record);
  };
}

module.exports = SmartFieldsValuesInjector;
