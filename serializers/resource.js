'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../generators/schemas');

function ResourceSerializer(Implementation, model, records, integrator,
  opts, meta) {
  var schema = Schemas.schemas[Implementation.getModelName(model)];

  var reservedWords = ['meta'];

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
            var referenceType = typeForAttributes[field.field] =
              field.reference.split('.')[0];
            var referenceSchema = Schemas.schemas[referenceType];

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

    return new JSONAPISerializer(schema.name, records,
      serializationOptions);
  };
}

module.exports = ResourceSerializer;
