const _ = require('lodash');
const P = require('bluebird');
const moment = require('moment');
const semver = require('semver');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');
const Schemas = require('../generators/schemas');
const logger = require('../services/logger');

function ResourceSerializer(Implementation, model, records, integrator, opts, meta,
  fieldsSearched, searchValue, fieldsPerModel) {
  var modelName = Implementation.getModelName(model);
  var schema = Schemas.schemas[modelName];

  const needsDateOnlyFormating = Implementation.getLianaName() === 'forest-express-sequelize' &&
    semver.lt(Implementation.getOrmVersion(), '4.0.0');

  var reservedWords = ['meta'];
  var fieldInfoDateonly = [];
  var fieldInfoPoint = [];

  function getFieldsNames(fields) {
    return fields.map(function (field) {
      if (reservedWords.indexOf(field.field) > -1) {
        return field.field + ':namespace' + field.field;
      } else {
        return field.field;
      }
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

  this.perform = function () {
    var typeForAttributes = {};

    function getAttributesFor(dest, fields) {
      _.map(fields, function (field) {
        detectFieldWithSpecialFormat(field);

        if (field.integration) {
          if (integrator) {
            integrator.defineSerializationOption(model, schema, dest, field);
          }
        } else {
          var fieldName = field.field;
          if (reservedWords.indexOf(fieldName) > -1) {
            fieldName = 'namespace' + fieldName;
          }

          if (_.isPlainObject(field.type)) {
            dest[fieldName] = {
              attributes: getFieldsNames(field.type.fields)
            };

            getAttributesFor(dest[field.field], field.type.fields);
          } else if (field.reference) {
            var referenceType = field.reference.split('.')[0];
            var referenceSchema = Schemas.schemas[referenceType];
            typeForAttributes[field.field] = referenceType;

            if (!referenceSchema) {
              logger.error('Cannot find the \'' + referenceType +
              '\' reference field for \'' + schema.name + '\' collection.');
              return;
            }

            var fieldReference = referenceSchema.idField;

            if (_.isArray(field.type) && !fieldReference && referenceSchema.isVirtual) {
              if (_.find(referenceSchema.fields, function (field) { return field.field === 'id'; })) {
                fieldReference = 'id';
              } else {
                logger.warn('Cannot find the \'idField\' attribute in your \'' +
                  referenceSchema.name + '\' Smart Collection declaration.');
              }
            }

            _.each(referenceSchema.fields, function (field) {
              detectFieldWithSpecialFormat(field, fieldName);
            });

            dest[fieldName] = {
              ref: fieldReference,
              attributes: getFieldsNames(referenceSchema.fields),
              relationshipLinks: {
                related: function (dataSet) {
                  return {
                    href: '/forest/' + Implementation.getModelName(model) +
                      '/' + dataSet[schema.idField] + '/relationships/' +
                      field.field,
                  };
                }
              }
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
      var offsetServer = moment().utcOffset() / 60;

      _.each(fieldInfoDateonly, function (fieldInfo) {
        var dateonly;
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

      _.each(fieldInfoPoint, function (fieldInfo) {
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

    var serializationOptions = {
      id: schema.idField,
      attributes: getFieldsNames(schema.fields),
      keyForAttribute: function (key) { return key; },
      typeForAttribute: function (attribute) {
        return typeForAttributes[attribute] || attribute;
      },
      meta: meta
    };

    getAttributesFor(serializationOptions, schema.fields);

    // NOTICE: Format Dateonly field types before serialization.
    if (_.isArray(records)) {
      _.each(records, function (record) {
        formatFields(record);
      });
    } else {
      formatFields(records);
    }

    return new P(function (resolve) {
      if (_.isArray(records)) {
        var smartFieldsValuesInjector;
        resolve(P
          .map(records, function (record) {
            smartFieldsValuesInjector =
              new SmartFieldsValuesInjector(record, modelName, fieldsPerModel);
            return smartFieldsValuesInjector.perform();
          })
          .then(function(result) {
            if (fieldsSearched && smartFieldsValuesInjector) {
              fieldsSearched = fieldsSearched.concat(smartFieldsValuesInjector.getFieldsForHighlightedSearch());
            }
            return result;
          }));
      } else {
        resolve(new SmartFieldsValuesInjector(records, modelName, fieldsPerModel).perform());
      }
    })
      .then(function () {
        var decorators = null;
        if (searchValue) {
          decorators = Implementation.RecordsDecorator.decorateForSearch(
            records,
            fieldsSearched,
            searchValue
          );
          if (decorators) {
            serializationOptions.meta.decorators = decorators;
          }
        }
      })
      .then(function () {
        return new JSONAPISerializer(schema.name, records, serializationOptions);
      });
  };
}

module.exports = ResourceSerializer;
