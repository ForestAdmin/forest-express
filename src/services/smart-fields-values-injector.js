const _ = require('lodash');
const P = require('bluebird');
const logger = require('../services/logger');
const Schemas = require('../generators/schemas');

function SmartFieldsValuesInjector(record, modelName, fieldsPerModel) {
  const schema = Schemas.schemas[modelName];
  const fieldsForHighlightedSearch = [];

  this.getFieldsForHighlightedSearch = () => fieldsForHighlightedSearch;

  // eslint-disable-next-line
  function setSmartFieldValue(record, field, modelName) {
    function addFieldForHighlightIfCandidate(fieldToCheck) {
      if (fieldToCheck.type === 'String') {
        fieldsForHighlightedSearch.push(fieldToCheck.field);
      }
    }

    try {
      let value;
      if (field.value) {
        logger.warn(`DEPRECATION WARNING: Smart Fields "value" method is deprecated. Please use "get" method in your collection ${modelName} instead.`);
      }

      try {
        value = field.get ? field.get(record) : field.value(record);
      } catch (error) {
        logger.error(`Cannot retrieve the ${field.field} value because of an internal error in the getter implementation: ${error}`);
      }

      if (!_.isNil(value)) {
        if (_.isFunction(value.then)) {
          return value
            .then((result) => {
              // NOTICE: We need some recursion in order to consider smart fields in smart
              //         relations. So if the result contains data and the field has a reference
              //         then we consider we have to inject smart fields within the reference.
              if (result && result.dataValues && field.reference) {
                const modelNameAssociation = field.reference.split('.')[0];
                const smartFieldsValuesInjector = new SmartFieldsValuesInjector(
                  result,
                  modelNameAssociation,
                  fieldsPerModel,
                );
                smartFieldsValuesInjector.perform();
              }

              record[field.field] = result;
              addFieldForHighlightIfCandidate(field);
            })
            .catch((error) => {
              logger.warn(`Cannot set the field.field value because of an unexpected error: ${error}`);
            });
        }
        record[field.field] = value;
        return addFieldForHighlightIfCandidate(field);
      }
    } catch (error) {
      logger.warn(`Cannot set the ${field.field} value because of an unexpected error: ${error}`);
    }
  }

  function isNotRequestedField(modelNameToCheck, fieldName) {
    return fieldsPerModel &&
      fieldsPerModel[modelNameToCheck] &&
      fieldsPerModel[modelNameToCheck].indexOf(fieldName) === -1;
  }

  this.perform = () =>
    P.each(schema.fields, (field) => {
      if (!record[field.field]) {
        if (field.get || field.value) {
          if (isNotRequestedField(modelName, field.field)) {
            return null;
          }

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
            if (isNotRequestedField(field.field, fieldAssociation.field)) {
              return null;
            }

            if (!record[field.field][fieldAssociation.field] &&
              (fieldAssociation.get || fieldAssociation.value)) {
              return setSmartFieldValue(
                record[field.field],
                fieldAssociation,
                modelNameAssociation,
              );
            }

            return null;
          });
        }
      }

      return null;
    })
      .thenReturn(record);
}

module.exports = SmartFieldsValuesInjector;
