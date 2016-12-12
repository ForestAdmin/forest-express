'use strict';
var P = require('bluebird');

module.exports = {
  schemas: {},
  perform: function (implementation, integrator, models, opts) {
    var that = this;
    return P
      .each(models, function (model) {
        return new implementation.SchemaAdapter(model, opts)
          .then(function (schema) {
            integrator.defineFields(implementation, model, schema);
            integrator.defineSegments(implementation, model, schema);
            return schema;
          })
          .then(function (schema) {
            that.schemas[implementation.getModelName(model)] = schema;
          });
      });
  }
};
