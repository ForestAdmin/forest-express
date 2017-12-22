const P = require('bluebird');

module.exports = {
  schemas: {},
  perform(implementation, integrator, models, opts) {
    const that = this;
    return P
      .each(models, model => new implementation.SchemaAdapter(model, opts)
        .then((schema) => {
          integrator.defineFields(model, schema);
          integrator.defineSegments(model, schema);
          schema.isSearchable = true;
          return schema;
        })
        .then((schema) => {
          that.schemas[implementation.getModelName(model)] = schema;
        }));
  },
};
