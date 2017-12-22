
const _ = require('lodash');
const P = require('bluebird');
const moment = require('moment');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');
const Schemas = require('../generators/schemas');
const logger = require('../services/logger');

function ResourceSerializer(Implementation, model, records, integrator, opts, meta) {
  const modelName = Implementation.getModelName(model);
  const schema = Schemas.schemas[modelName];

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
    if (field.type === 'Dateonly') {
      fieldInfoDateonly.push({ name: field.field, association: fieldReference });
    }

    if (field.type === 'Point') {
      fieldInfoPoint.push({ name: field.field, association: fieldReference });
    }
  }

  this.perform = function () {
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
              logger.error(`Cannot find the '${referenceType
              }' reference field for '${schema.name}' collection.`);
              return;
            }

            let fieldReference = referenceSchema.idField;

            if (_.isArray(field.type) && !fieldReference && referenceSchema.isVirtual) {
              if (_.find(referenceSchema.fields, field => field.field === 'id')) {
                fieldReference = 'id';
              } else {
                logger.warn(`Cannot find the 'idField' attribute in your '${
                  referenceSchema.name}' Smart Collection declaration.`);
              }
            }

            _.each(referenceSchema.fields, (field) => {
              detectFieldWithSpecialFormat(field, fieldName);
            });

            dest[fieldName] = {
              ref: fieldReference,
              attributes: getFieldsNames(referenceSchema.fields),
              relationshipLinks: {
                related(dataSet) {
                  return {
                    href: `/forest/${Implementation.getModelName(model)
                    }/${dataSet[schema.idField]}/relationships/${
                      field.field}`,
                  };
                },
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

      _.each(fieldInfoDateonly, (fieldInfo) => {
        let dateonly;
        if (fieldInfo.association && record[fieldInfo.association] && fieldInfo.name &&
          record[fieldInfo.association][fieldInfo.name]) {
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
        if (fieldInfo.association && record[fieldInfo.association] && fieldInfo.name &&
          record[fieldInfo.association][fieldInfo.name]) {
          record[fieldInfo.association][fieldInfo.name] =
            record[fieldInfo.association][fieldInfo.name].coordinates;
        }
        if (fieldInfo.name && record[fieldInfo.name]) {
          record[fieldInfo.name] = record[fieldInfo.name].coordinates;
        }
      });
    }

    const serializationOptions = {
      id: schema.idField,
      attributes: getFieldsNames(schema.fields),
      keyForAttribute(key) { return key; },
      typeForAttribute(attribute) {
        return typeForAttributes[attribute] || attribute;
      },
      meta,
    };

    getAttributesFor(serializationOptions, schema.fields);

    // NOTICE: Format Dateonly field types before serialization.
    if (_.isArray(records)) {
      _.each(records, (record) => {
        formatFields(record);
      });
    } else {
      formatFields(records);
    }

    return new P(((resolve) => {
      if (_.isArray(records)) {
        resolve(P.map(records, record => new SmartFieldsValuesInjector(record, modelName).perform()));
      } else {
        resolve(new SmartFieldsValuesInjector(records, modelName).perform());
      }
    }))
      .then(() => new JSONAPISerializer(schema.name, records, serializationOptions));
  };
}

module.exports = ResourceSerializer;
