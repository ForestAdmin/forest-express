'use strict';
var P = require('bluebird');
var _ = require('lodash');

function isArray(object) {
  return object && _.isArray(object);
}

module.exports = {
  schemas: {},
  perform: function (implementation, integrator, models, opts) {
    var that = this;
    return P
      .each(models, function (model) {
        return new implementation.SchemaAdapter(model, opts)
          .then(function (schema) {
            integrator.defineFields(model, schema);
            integrator.defineSegments(model, schema);
            schema.isSearchable = true;
            return schema;
          })
          .then(function (schema) {
            var modelName = implementation.getModelName(model);

            if (that.schemas[modelName]) {
              var currentSchema = that.schemas[modelName];

              schema.fields = _.concat(schema.fields || [], currentSchema.fields || []);
              schema.actions = _.concat(schema.actions || [], currentSchema.actions || []);
              schema.segments = _.concat(schema.segments || [], currentSchema.segments || []);

              // NOTICE: Set this value only if searchFields property as been declared somewhere.
              if (isArray(schema.searchFields) || isArray(currentSchema.searchFields)) {
                schema.searchFields = _.concat(schema.searchFields || [], currentSchema.searchFields || []);
              }
            }

            that.schemas[modelName] = schema;
          });
      });
  }
};
