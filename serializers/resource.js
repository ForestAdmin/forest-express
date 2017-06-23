'use strict';
var _ = require('lodash');
var moment = require('moment');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../generators/schemas');

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

        if (field.integration) {
          integrator.defineSerializationOption(Implementation, model, schema,
            dest, field);
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

            dest[fieldName] = {
              ref: referenceSchema.idField,
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

    function formatDateonly(record) {
      var offsetServer = moment().utcOffset() / 60;

      _.each(fieldNamesDateonly, function (fieldName) {
        if (record[fieldName]) {
          var dateonly = moment.utc(record[fieldName]).add(offsetServer, 'h');
          record[fieldName] = dateonly.format();
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
        formatDateonly(record);
      });
    } else {
      formatDateonly(records);
    }

    var typeName = toKebabCase(schema.name);
    return new JSONAPISerializer(typeName, records, serializationOptions);
  };
}

module.exports = ResourceSerializer;
