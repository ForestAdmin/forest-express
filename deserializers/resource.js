'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Schemas = require('../generators/schemas');

function ResourceDeserializer(Implementation, model, params, opts) {
  var schema = Schemas.schemas[Implementation.getModelName(model)];

  function extractAttributes() {
    return new P(function (resolve) {
      var attributes = params.data.attributes;
      attributes[schema.idField] = params.data.attributes[schema.idField];

      if (opts.omitNullAttributes) {
        attributes = _.pickBy(attributes, function (value) {
          return value;
        });
      }

      resolve(attributes);
    });
  }

  function extractRelationships() {
    return new P(function (resolve) {
      var relationships = {};

      _.each(schema.fields, function (field) {
        if (field.reference && params.data.relationships &&
          params.data.relationships[field.field]) {

          if (params.data.relationships[field.field].data === null) {
            // Remove the relationships
            relationships[field.field] = null;
          } else if (params.data.relationships[field.field].data) {
            // Set the relationship
            if (_.isArray(params.data.relationships[field.field].data)) {
              relationships[field.field] = params.data.relationships[field.field]
                .data.map(function (d) {
                  return d.id;
                });
            } else {
              relationships[field.field] = params.data.relationships[field.field]
                .data.id;
            }
          }  // Else ignore the relationship
        }
      });

      resolve(relationships);
    });
  }

  this.perform = function () {
    return P.all([extractAttributes(), extractRelationships()])
      .spread(function (attributes, relationships) {
        return _.extend(attributes, relationships);
      });
  };
}

module.exports = ResourceDeserializer;

