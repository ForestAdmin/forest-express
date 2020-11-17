const P = require('bluebird');

function isArray(object) {
  return object && Array.isArray(object);
}

module.exports = {
  schemas: {},

  _concat(left, right) {
    const leftArray = left || [];
    const rightArray = right || [];
    return leftArray.concat(rightArray);
  },

  perform(implementation, integrator, models, opts) {
    return P.each(models, (model) =>
      implementation.SchemaAdapter(model, opts)
        .then((schema) => {
          integrator.defineFields(model, schema);
          integrator.defineSegments(model, schema);
          schema.isSearchable = true;
          return schema;
        })
        .then((schema) => {
          const modelName = implementation.getModelName(model);

          if (this.schemas[modelName]) {
            const currentSchema = this.schemas[modelName];

            schema.fields = this._concat(schema.fields, currentSchema.fields);
            schema.actions = this._concat(schema.actions, currentSchema.actions);
            schema.segments = this._concat(schema.segments, currentSchema.segments);

            // Set this value only if searchFields property as been declared somewhere.
            if (isArray(schema.searchFields) || isArray(currentSchema.searchFields)) {
              schema.searchFields = this._concat(
                schema.searchFields,
                currentSchema.searchFields,
              );
            }
          }

          this.schemas[modelName] = schema;
        }));
  },
};
