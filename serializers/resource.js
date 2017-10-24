'use strict';
var _ = require('lodash');
var moment = require('moment');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../generators/schemas');
var logger = require('../services/logger');

function toKebabCase(string) {
  // NOTICE: Support for the collections beginning with an underscore.
  if (string[0] === '_') { return '_' + _.kebabCase(string); }
  return _.kebabCase(string);
}

function ResourceSerializer(Implementation, model, records, integrator,
  opts, meta) {
  var schema = Schemas.schemas[Implementation.getModelName(model)];

  var reservedWords = ['meta'];
  var fieldNamesDateonly = [];
  var fieldPoints = [];

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
          fieldPoints.push(field.field);
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
            typeForAttributes[field.field] = toKebabCase(referenceType);

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
                  var ret = {
                    href: '/forest/' + Implementation.getModelName(model) +
                      '/' + dataSet[schema.idField] + '/relationships/' +
                      field.field,
                  };

                  return ret;
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

      _.each(fieldNamesDateonly, function (fieldName) {
        if (record[fieldName]) {
          var dateonly = moment.utc(record[fieldName]).add(offsetServer, 'h');
          record[fieldName] = dateonly.format();
        }
      });

      _.each(fieldPoints, function (fieldName) {
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

    var typeName = toKebabCase(schema.name);
    return new JSONAPISerializer(typeName, records, serializationOptions);
  };
}

module.exports = ResourceSerializer;
