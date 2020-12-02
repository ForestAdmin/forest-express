const _ = require('lodash');
const P = require('bluebird');
const logger = require('../services/logger');
const Schemas = require('../generators/schemas');

const DEPTH_MAX_FOR_INJECTION = 0;

function SmartFieldsValuesInjector(
  record,
  modelName,
  fieldsPerModel,
  depth = 0,
  requestedField = null,
) {
  const schema = Schemas.schemas[modelName];
  const fieldsForHighlightedSearch = [];

  this.getFieldsForHighlightedSearch = () => fieldsForHighlightedSearch;

  // NOTICE: Field reference format: `modelName.property`.
  function getReferencedModelName(field) {
    return field.reference.split('.')[0];
  }

  // eslint-disable-next-line
  function setSmartFieldValue(record, field, modelName) {
    if (field.value) {
      logger.warn(`DEPRECATION WARNING: Smart Fields "value" method is deprecated. Please use "get" method in your collection ${modelName} instead.`);
    }

    let value;
    try {
      value = field.get ? field.get(record) : field.value(record);
    } catch (error) {
      logger.error(`Cannot retrieve the ${field.field} value because of an internal error in the getter implementation: `, error);
    }

    if (!_.isNil(value)) {
      if (!_.isFunction(value.then)) {
        value = Promise.resolve(value);
      }
      return value
        .then(async (smartFieldValue) => {
          // NOTICE: If the Smart Field is a Smart Relationship (ie references another record type),
          //         we also need to inject the values of the referenced records Smart Fields.
          if (depth <= DEPTH_MAX_FOR_INJECTION && smartFieldValue && field.reference) {
            const smartFieldsValuesInjector = new SmartFieldsValuesInjector(
              smartFieldValue,
              getReferencedModelName(field),
              fieldsPerModel,
              depth + 1,
              field.field,
            );
            await smartFieldsValuesInjector.perform();
          }
          // NOTICE: Sequelize magic accessors can be overriden here
          // but it is not an issue as they are not used in the process of adding
          // smart fields which is included in the process of serialization
          record[field.field] = smartFieldValue;
          // NOTICE: String fields can be highlighted.
          if (field.type === 'String') {
            fieldsForHighlightedSearch.push(field.field);
          }
        })
        .catch((error) => {
          logger.warn(`Cannot set the ${field.field} value because of an unexpected error: `, error);
        });
    }
  }

  function isNotRequestedField(modelNameToCheck, fieldName) {
    return fieldsPerModel
      && fieldsPerModel[modelNameToCheck]
      && fieldsPerModel[modelNameToCheck].indexOf(fieldName) === -1;
  }

  this.perform = () =>
    P.each(schema.fields, (field) => {
      if (record
          && !Object.prototype.hasOwnProperty.call(record, field.field)) {
        if (field.get || field.value) {
          if (isNotRequestedField(requestedField || modelName, field.field)) {
            return null;
          }

          return setSmartFieldValue(record, field, modelName);
        }
        if (_.isArray(field.type)) {
          record[field.field] = [];
        }
      } else if (field.reference && !_.isArray(field.type)) {
        // NOTICE: Set Smart Fields values to "belongsTo" associated records.
        const modelNameAssociation = getReferencedModelName(field);
        const schemaAssociation = Schemas.schemas[modelNameAssociation];

        if (schemaAssociation && !_.isArray(field.type)) {
          return P.each(schemaAssociation.fields, (fieldAssociation) => {
            if (isNotRequestedField(field.field, fieldAssociation.field)) {
              return null;
            }

            if (record
                && record[field.field]
                && !Object.prototype.hasOwnProperty.call(
                  record[field.field],
                  fieldAssociation.field,
                )
                && (fieldAssociation.get || fieldAssociation.value)) {
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
