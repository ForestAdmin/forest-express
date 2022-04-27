const _ = require('lodash');
const P = require('bluebird');
const moment = require('moment');
const semver = require('semver');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');
const Schemas = require('../generators/schemas');
const logger = require('../services/logger');

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

    function getRelatedLinkForHasMany(relatedModelName, relationshipName) {
      return (record, current, parent) => {
        if (current && current[relationshipName]) {
          return null;
        }
        return `/forest/${relatedModelName}/${parent.id}/relationships/${relationshipName}`;
      };
    }

    function getReferenceField(referenceSchema, field) {
      let fieldReference = referenceSchema.idField;

      if (_.isArray(field.type) && !fieldReference && referenceSchema.isVirtual) {
        if (_.find(referenceSchema.fields, (subField) => subField.field === 'id')) {
          fieldReference = 'id';
        } else {
          logger.warn(`Cannot find the 'idField' attribute in your '${referenceSchema.name}' Smart Collection declaration.`);
        }
      }

      return fieldReference || 'id';
    }

    function getAttributesFor(dest, fields, include = true) {
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

            getAttributesFor(dest[field.field], field.type.fields, include);
          } else if (field.reference) {
            const referenceType = field.reference.split('.')[0];
            const referenceSchema = Schemas.schemas[referenceType];
            typeForAttributes[field.field] = referenceType;

            if (!referenceSchema) {
              logger.error(`Cannot find the '${referenceType}' reference field for '${schema.name}' collection.`);
              return;
            }

            const fieldReference = getReferenceField(referenceSchema, field);

            _.each(referenceSchema.fields, (schemaField) => {
              detectFieldWithSpecialFormat(schemaField, fieldName);
            });

            const relatedFunction = field.relationship === 'BelongsTo'
              ? null
              : getRelatedLinkForHasMany(modelName, field.field);
            dest[fieldName] = {
              ref: fieldReference,
              nullIfMissing: true,
              attributes: getFieldsNames(referenceSchema.fields),
              relationshipLinks: {
                related: relatedFunction,
              },
            };

            if (_.isArray(field.type) || !include) {
              dest[fieldName].ignoreRelationshipData = include;
              dest[fieldName].included = false;
            } else if (include) {
              const referenceFields = referenceSchema.fields
                .filter((subField) => subField.reference);
              getAttributesFor(dest[fieldName], referenceFields, false);
            }
          }
        }
      });
    }

    function formatFields(record) {
      const offsetServer = moment().utcOffset() / 60;

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

    function defineRelationshipId(innerRecords, fields, goDeeper = true) {
      const recordArray = _.isArray(innerRecords) ? innerRecords : [innerRecords];
      recordArray.forEach((record) => {
        fields.forEach((field) => {
          if (!field.reference) {
            return;
          }

          const fieldName = field.field;
          const [referenceType, referenceKey] = field.reference.split('.');
          const referenceSchema = Schemas.schemas[referenceType];
          if (goDeeper && record[fieldName]) {
            defineRelationshipId(record[fieldName], referenceSchema.fields, false);
          }

          if (field.relationship === 'BelongsTo') {
            if (!record[fieldName]) {
              const fieldReference = getReferenceField(referenceSchema, field);

              record[fieldName] = {
                [fieldReference]: record[referenceKey],
              };
            }
          }
        });
      });
    }

    const attributes = getFieldsNames(schema.fields);

    const serializationOptions = {
      id: schema.idField,
      attributes,
      keyForAttribute: (key) => key,
      typeForAttribute: (attribute) => typeForAttributes[attribute] || attribute,
      meta,
    };

    if (Implementation?.Flattener) {
      const flattenedFieldsNames = attributes?.filter(
        (attribute) => Implementation.Flattener._isFieldFlattened(attribute));

      const flattenedFieldsAccessors = flattenedFieldsNames
        ?.map((elem) => ({ [elem]: Implementation.Flattener.splitOnSeparator(elem) }));

      if (flattenedFieldsAccessors.length) {
        serializationOptions.transform = (record) => {
          flattenedFieldsAccessors.forEach((accessors) => {
            Object.entries(accessors).forEach(([fieldName, accessor]) => {
              record[fieldName] = accessor.reduce((a, prop) => (a ? a[prop] : null), record);
            });
          });
          return record;
        };
      }
    }

    getAttributesFor(serializationOptions, schema.fields);
    defineRelationshipId(records, schema.fields);
    // NOTICE: Format Dateonly field types before serialization.
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
      .then(() => {
        let decorators = null;
        if (searchValue) {
          decorators = Implementation.RecordsDecorator.decorateForSearch(
            records,
            fieldsSearched,
            searchValue,
          );
          if (decorators) {
            serializationOptions.meta = { decorators };
          }
        }
      })
      .then(() => new JSONAPISerializer(schema.name, records, serializationOptions));
  };
}

module.exports = ResourceSerializer;
