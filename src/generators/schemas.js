const P = require('bluebird');

function isArray(object) {
  return object && Array.isArray(object);
}

module.exports = {
  schemas: {},
  perform(implementation, integrator, models, opts) {
    const that = this;
    return P
      .each(models, (model) =>
        implementation.SchemaAdapter(model, opts)
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

              schema.fields = (schema.fields || []).concat(currentSchema.fields || []);
              schema.actions = (schema.actions || []).concat(currentSchema.actions || []);
              schema.segments = (schema.segments || []).concat(currentSchema.segments || []);

              // NOTICE: Set this value only if searchFields property as been declared somewhere.
              if (isArray(schema.searchFields) || isArray(currentSchema.searchFields)) {
                schema.searchFields = (schema.searchFields || [])
                  .concat(currentSchema.searchFields || []);
              }
            }

            that.schemas[modelName] = schema;
          }));
  },
};
