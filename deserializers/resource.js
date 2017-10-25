'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Schemas = require('../generators/schemas');

function ResourceDeserializer(Implementation, model, params,
  withRelationships, opts) {
  if (!opts) { opts = {}; }
  var schema = Schemas.schemas[Implementation.getModelName(model)];

  function extractAttributes() {
    var attributes = params.data.attributes;
    if (params.data.attributes) {
      attributes[schema.idField] = params.data.attributes[schema.idField] ||
        params.data.id;
    }

    // NOTICE: Look for some Smart Field setters and apply them if any.
    var fieldsVirtual = _.filter(schema.fields, function (field) {
      return field.isVirtual && field.set;
    });

    _.each(schema.fields, function (field) {
      if (field.type === 'Point' && params.data.attributes[field.field]) {
        var coordinates = params.data.attributes[field.field].split(',');
        params.data.attributes[field.field] = {
          type: 'Point',
          coordinates: coordinates
        };
      }
    });

    return P
      .each(fieldsVirtual, function (field) {
        // WARNING: The Smart Fields setters may override other changes.
        if (_.isFunction(field.set.then)) {
          return field.set(attributes, attributes[field.field])
            .then(function (newAttributes) {
              attributes = newAttributes;
              return attributes;
            });
        } else {
          attributes = field.set(attributes, attributes[field.field]);
          return attributes;
        }
      })
      .then(function () {
        if (opts.omitNullAttributes) {
          attributes = _.pickBy(attributes, function (value) {
            return !_.isNull(value);
          });
        }

        return attributes || {};
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
    if (withRelationships) {
      return P.all([extractAttributes(), extractRelationships()])
        .spread(function (attributes, relationships) {
          return _.extend(attributes, relationships);
        });
    } else {
      return extractAttributes();
    }
  };
}

module.exports = ResourceDeserializer;
