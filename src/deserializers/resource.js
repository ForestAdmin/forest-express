const _ = require('lodash');
const P = require('bluebird');
const logger = require('../services/logger');
const Schemas = require('../generators/schemas');

function ResourceDeserializer(Implementation, model, params, withRelationships, opts) {
  if (!opts) { opts = {}; }
  const schema = Schemas.schemas[Implementation.getModelName(model)];

  function extractAttributes() {
    let { attributes } = params.data;
    if (params.data.attributes) {
      attributes[schema.idField] = params.data.attributes[schema.idField]
        || params.data.id;
    }

    // NOTICE: Look for some Smart Field setters and apply them if any.
    const smartFields = _.filter(schema.fields, (field) => {
      if (field.isVirtual && field.set && field.reference) {
        logger.warn(`The "${field.field}" Smart Relationship cannot be updated implementing a "set" function.`);
      }
      return field.isVirtual && field.set && !field.reference;
    });

    _.each(schema.fields, (field) => {
      if (field.type === 'Point' && params.data.attributes[field.field]) {
        const coordinates = params.data.attributes[field.field].split(',');
        params.data.attributes[field.field] = {
          type: 'Point',
          coordinates,
        };
      }
    });

    return P
      .each(smartFields, (field) => {
        // WARNING: The Smart Fields setters may override other changes.
        if (field.field in attributes) {
          return field.set(attributes, attributes[field.field]);
        }
        return null;
      })
      .then(() => {
        if (opts.omitNullAttributes) {
          attributes = _.pickBy(attributes, (value) => !_.isNull(value));
        }

        return attributes || {};
      });
  }

  function extractRelationships() {
    return new P((resolve) => {
      const relationships = {};

      _.each(schema.fields, (field) => {
        if (field.reference && params.data.relationships
          && params.data.relationships[field.field]) {
          if (params.data.relationships[field.field].data === null) {
            // Remove the relationships
            relationships[field.field] = null;
          } else if (params.data.relationships[field.field].data) {
            // Set the relationship
            if (_.isArray(params.data.relationships[field.field].data)) {
              relationships[field.field] = params.data.relationships[field.field]
                .data.map((d) => d.id);
            } else {
              relationships[field.field] = params.data.relationships[field.field]
                .data.id;
            }
          } // Else ignore the relationship
        }
      });

      resolve(relationships);
    });
  }

  this.perform = () => {
    if (withRelationships) {
      return P.all([extractAttributes(), extractRelationships()])
        .spread((attributes, relationships) => _.extend(attributes, relationships));
    }
    return extractAttributes();
  };
}

module.exports = ResourceDeserializer;
