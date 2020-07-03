const _ = require('lodash');
const P = require('bluebird');
const moment = require('moment');
const semver = require('semver');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');
const Schemas = require('../generators/schemas');
const logger = require('../services/logger');
const { recursivelyAddSmartValues } = require('../utils/smart-values');

function ResourceSerializer(
  Implementation,
  model,
  records,
  integrator,
  meta,
  fieldsSearched,
  searchValue,
  fieldsPerModel,
) {
  const modelName = Implementation.getModelName(model);
  const schema = Schemas.schemas[modelName];

  const needsDateOnlyFormating = Implementation.getLianaName() === 'forest-express-sequelize'
    && semver.lt(Implementation.getOrmVersion(), '4.0.0');

  const reservedWords = ['meta'];
  const fieldInfoDateonly = [];
  const fieldInfoPoint = [];

  function getFieldsNames(fields) {
    return fields.map((field) => {
      if (reservedWords.indexOf(field.field) > -1) {
        return `${field.field}:namespace${field.field}`;
      }
      return field.field;
    });
  }

  function detectFieldWithSpecialFormat(field, fieldReference) {
    if (field.type === 'Dateonly' && needsDateOnlyFormating) {
      fieldInfoDateonly.push({ name: field.field, association: fieldReference });
    }

    if (field.type === 'Point') {
      fieldInfoPoint.push({ name: field.field, association: fieldReference });
    }
  }

  this.perform = () => {
    const typeForAttributes = {};

    function getAttributesFor(dest, fields) {
      _.map(fields, (field) => {
        detectFieldWithSpecialFormat(field);

        if (field.integration) {
          if (integrator) {
            integrator.defineSerializationOption(model, schema, dest, field);
          }
        } else {
          let fieldName = field.field;
          if (reservedWords.indexOf(fieldName) > -1) {
            fieldName = `namespace${fieldName}`;
          }

          if (_.isPlainObject(field.type)) {
            dest[fieldName] = {
              attributes: getFieldsNames(field.type.fields),
            };

            getAttributesFor(dest[field.field], field.type.fields);
          } else if (field.reference) {
            const referenceType = field.reference.split('.')[0];
            const referenceSchema = Schemas.schemas[referenceType];
            typeForAttributes[field.field] = referenceType;

            if (!referenceSchema) {
              logger.error(`Cannot find the '${referenceType}' reference field for '${schema.name}' collection.`);
              return;
            }

            let fieldReference = referenceSchema.idField;

            if (_.isArray(field.type) && !fieldReference && referenceSchema.isVirtual) {
              if (_.find(referenceSchema.fields, (schemaField) => schemaField.field === 'id')) {
                fieldReference = 'id';
              } else {
                logger.warn(`Cannot find the 'idField' attribute in your '${referenceSchema.name}' Smart Collection declaration.`);
              }
            }

            _.each(referenceSchema.fields, (schemaField) => {
              detectFieldWithSpecialFormat(schemaField, fieldName);
            });

            dest[fieldName] = {
              ref: fieldReference,
              attributes: getFieldsNames(referenceSchema.fields),
              relationshipLinks: {
                related: (dataSet) => ({
                  href: `/forest/${Implementation.getModelName(model)}/${dataSet[schema.idField]}/relationships/${field.field}`,
                }),
              },
            };

            if (_.isArray(field.type)) {
              dest[fieldName].ignoreRelationshipData = true;
              dest[fieldName].included = false;
            }
          }
        }
      });
    }

    function formatFields(record) {
      const offsetServer = moment().utcOffset() / 60;

      // NOTICE: Format Dateonly field types before serialization.
      _.each(fieldInfoDateonly, (fieldInfo) => {
        let dateonly;
        if (fieldInfo.association && record[fieldInfo.association] && fieldInfo.name
          && record[fieldInfo.association][fieldInfo.name]) {
          dateonly = moment.utc(record[fieldInfo.association][fieldInfo.name])
            .add(offsetServer, 'h');
          record[fieldInfo.association][fieldInfo.name] = dateonly.format();
        }
        if (fieldInfo.name && record[fieldInfo.name]) {
          dateonly = moment.utc(record[fieldInfo.name]).add(offsetServer, 'h');
          record[fieldInfo.name] = dateonly.format();
        }
      });

      _.each(fieldInfoPoint, (fieldInfo) => {
        if (fieldInfo.association && record[fieldInfo.association] && fieldInfo.name
          && record[fieldInfo.association][fieldInfo.name]) {
          record[fieldInfo.association][fieldInfo.name] = record[fieldInfo
            .association][fieldInfo.name].coordinates;
        }
        if (fieldInfo.name && record[fieldInfo.name]) {
          record[fieldInfo.name] = record[fieldInfo.name].coordinates;
        }
      });
    }

    const serializationOptions = {
      id: schema.idField,
      attributes: getFieldsNames(schema.fields),
      keyForAttribute: (key) => key,
      typeForAttribute: (attribute) => typeForAttributes[attribute] || attribute,
      meta,
    };

    getAttributesFor(serializationOptions, schema.fields);

    if (_.isArray(records)) {
      _.each(records, (record) => { formatFields(record); });
    } else {
      formatFields(records);
    }

    return new P((resolve) => {
      if (_.isArray(records)) {
        let smartFieldsValuesInjector;
        resolve(P
          .map(records, (record) => {
            smartFieldsValuesInjector = new SmartFieldsValuesInjector(
              record,
              modelName,
              fieldsPerModel,
            );
            return smartFieldsValuesInjector.perform();
          })
          .then((result) => {
            if (fieldsSearched && smartFieldsValuesInjector) {
              fieldsSearched = fieldsSearched
                .concat(smartFieldsValuesInjector.getFieldsForHighlightedSearch());
            }
            return result;
          }));
      } else {
        resolve(new SmartFieldsValuesInjector(records, modelName, fieldsPerModel).perform());
      }
    })
      .then((recordsWithSmartFieldsValues) => {
        let decorators = null;
        if (searchValue) {
          decorators = Implementation.RecordsDecorator.decorateForSearch(
            recordsWithSmartFieldsValues,
            fieldsSearched,
            searchValue,
          );
          if (decorators) {
            serializationOptions.meta = { decorators };
          }
        }
        return recordsWithSmartFieldsValues;
      })
      .then((recordsWithSmartFieldsValues) => {
        // NOTICE: add smart fields inside record for correct further serialization
        //        (will override magic accessor method created by sequelize if same name)
        //         ex: get{Model}s, set{Model}s, add{Model}, add{Model}s, has{Model}, has{Model}s,
        //             count{Model}s, remove{Model}, remove{Model}s, create{Model}

        if (_.isArray(recordsWithSmartFieldsValues)) {
          _.each(recordsWithSmartFieldsValues, (record) => {
            recursivelyAddSmartValues(record);
            const referencesWithSmartValues = Object.keys(record.dataValues)
              .filter((x) => record.dataValues[x].smartValues);
            _.each(referencesWithSmartValues, (reference) =>
              recursivelyAddSmartValues(record[reference]));
          });
        } else {
          recursivelyAddSmartValues(recordsWithSmartFieldsValues);
          const referencesWithSmartValues = Object.keys(records.dataValues)
            .filter((x) => records.dataValues[x].smartValues);
          _.each(referencesWithSmartValues, (reference) =>
            recursivelyAddSmartValues(records[reference]));
        }

        return recordsWithSmartFieldsValues;
      })
      .then((recordsWithSmartFieldsValues) =>
        new JSONAPISerializer(schema.name, recordsWithSmartFieldsValues, serializationOptions));
  };
}

module.exports = ResourceSerializer;
