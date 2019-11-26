const P = require('bluebird');
const _ = require('lodash');

function isArray(object) {
  return object && _.isArray(object);
}

module.exports = {
  schemas: {},
  perform(implementation, integrator, models, opts) {
    const that = this;
    return P
      .each(models, (model) =>
        new implementation.SchemaAdapter(model, opts)
          .then((schema) => {
            integrator.defineFields(model, schema);
            integrator.defineSegments(model, schema);
            schema.isSearchable = true;
            return schema;
          })
          .then((schema) => {
            const modelName = implementation.getModelName(model);

            if (that.schemas[modelName]) {
              const currentSchema = that.schemas[modelName];

              schema.fields = _.concat(schema.fields || [], currentSchema.fields || []);
              schema.actions = _.concat(schema.actions || [], currentSchema.actions || []);
              schema.segments = _.concat(schema.segments || [], currentSchema.segments || []);

              // NOTICE: Set this value only if searchFields property as been declared somewhere.
              if (isArray(schema.searchFields) || isArray(currentSchema.searchFields)) {
                schema.searchFields = _.concat(
                  schema.searchFields || [],
                  currentSchema.searchFields || [],
                );
              }
            }

            that.schemas[modelName] = schema;
          }));
  },
};
