'use strict';
var _ = require('lodash');
var P = require('bluebird');
var moment = require('moment');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');
var Schemas = require('../generators/schemas');
var logger = require('../services/logger');

function ResourceSerializer(Implementation, model, records, integrator,
  opts, meta) {
  var modelName = Implementation.getModelName(model);
  var schema = Schemas.schemas[modelName];

  var reservedWords = ['meta'];
  var fieldNamesDateonly = [];
  var fieldNamesPoint = [];

  function getFieldsNames(fields) {
    return fields.map(function (field) {
      if (reservedWords.indexOf(field.field) > -1) {
        return field.field + ':namespace' + field.field;
      } else {
        return field.field;
      }
    });
  }

  this.perform = function () {
    var typeForAttributes = {};

    function getAttributesFor(dest, fields) {
      _.map(fields, function (field) {
        if (field.type === 'Dateonly') {
          fieldNamesDateonly.push(field.field);
        }

        if (field.type === 'Point') {
          fieldNamesPoint.push(field.field);
        }

        if (field.integration) {
          integrator.defineSerializationOption(model, schema, dest, field);
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

    function isDateOnlyString(field) {
      return moment(field, 'YYYY-MM-DD', true).isValid();
    }

    function formatFields(record) {
      var offsetServer = moment().utcOffset() / 60;

      _.each(fieldNamesDateonly, function (fieldName) {
        //Sequelize 4 returns date strings while 3 returns dateTimeStrings
        if (record[fieldName] && !isDateOnlyString(record[fieldName])) {
          var dateonly = moment.utc(record[fieldName]).add(offsetServer, 'h');
          record[fieldName] = dateonly.format();
        }
      });

      _.each(fieldNamesPoint, function (fieldName) {
        if (record[fieldName]) {
          record[fieldName] = record[fieldName].coordinates;
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
        resolve(P.map(records, function (record) {
          return new SmartFieldsValuesInjector(record, modelName).perform();
        }));
      } else {
        resolve(new SmartFieldsValuesInjector(records, modelName).perform());
      }
    })
      .then(function (recordsWithSmartFields) {
        return new JSONAPISerializer(schema.name, records, serializationOptions);
      });
  };
}

module.exports = ResourceSerializer;
