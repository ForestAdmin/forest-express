'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../generators/schemas');

function ResourceSerializer(Implementation, model, records, opts, meta) {
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

  function hasStripeIntegration() {
    return opts.integrations && opts.integrations.stripe &&
      opts.integrations.stripe.apiKey;
  }

  if (hasStripeIntegration()) {
    // jshint camelcase: false
    if (_.isArray(records)) {
      records = records.map(function (record) {
        record.stripe_payments = [];
        record.stripe_invoices = [];
        record.stripe_cards = [];
        return record;
      });
    } else {
      records.stripe_payments = [];
      records.stripe_invoices = [];
      records.stripe_cards = [];
    }
  }

  function hasIntercomIntegration() {
    return opts.integrations && opts.integrations.intercom &&
      opts.integrations.intercom.apiKey && opts.integrations.intercom.appId;
  }

  if (hasIntercomIntegration()) {
    // jshint camelcase: false
    if (_.isArray(records)) {
      records = records.map(function (record) {
        record.intercom_conversations = [];
        record.intercom_attributes = [];
        return record;
      });
    } else {
      records.intercom_conversations = [];
      records.intercom_attributes = [];
    }
  }

  this.perform = function () {
    var typeForAttributes = {};

    function getAttributesFor(dest, fields) {
      _.map(fields, function (field) {
        if (hasIntercomIntegration() && field.integration === 'intercom') {
          dest[field.field] = {
            ref: 'id',
            attributes: [],
            included: false,
            ignoreRelationshipData: true,
            relationshipLinks: {
              related: function (dataSet) {
                var ret = {
                  href: '/forest/' + Implementation.getModelName(model) +
                    '/' + dataSet.id + '/' + field.field,
                };
                return ret;
              }
            }
          };
        } else if (hasStripeIntegration() && field.integration === 'stripe') {
          dest[field.field] = {
            ref: 'id',
            attributes: [],
            included: false,
            ignoreRelationshipData: true,
            relationshipLinks: {
              related: function (dataSet) {
                var ret = {
                  href: '/forest/' + Implementation.getModelName(model) +
                    '/' + dataSet.id + '/' + field.field,
                };
                return ret;
              }
            }
          };
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
                      '/' + dataSet[schema.idField] + '/' +
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
