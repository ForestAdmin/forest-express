const P = require('bluebird');
const _ = require('lodash');
const logger = require('../services/logger');

function isArray(object) {
  return object && _.isArray(object);
}
function setDefaultValueIfNecessary(object, property, value) {
  object[property] = object[property] || value;
}

const cleanFields = (fields) => {
  fields = fields.filter(field => field.field);
  fields.forEach((field) => {
    if (field.defaultValue === undefined) {
      field.defaultValue = null;
    }
    setDefaultValueIfNecessary(field, 'type', 'String');
    setDefaultValueIfNecessary(field, 'isRequired', false);
    setDefaultValueIfNecessary(field, 'isReadOnly', false);
    setDefaultValueIfNecessary(field, 'isRequired', false);
    setDefaultValueIfNecessary(field, 'isSortable', false);
    setDefaultValueIfNecessary(field, 'isFilterable', false);
    setDefaultValueIfNecessary(field, 'isVirtual', false);
    setDefaultValueIfNecessary(field, 'description', null);
    setDefaultValueIfNecessary(field, 'reference', null);
    setDefaultValueIfNecessary(field, 'inverseOf', null);
    setDefaultValueIfNecessary(field, 'relationships', null);
    setDefaultValueIfNecessary(field, 'enums', null);
    setDefaultValueIfNecessary(field, 'validations', null);
    setDefaultValueIfNecessary(field, 'integration', null);
  });

  return fields;
};
const cleanSegments = segments => segments.filter(segment => segment.name);
const cleanActions = (actions) => {
  actions = actions.filter(action => action.name);
  actions.forEach((action) => {
    if (action.global) {
      logger.warn(`REMOVED OPTION: The support for Smart Action "global" option is now removed. Please set "type: 'global'" instead of "global: true" for the "${action.name}" Smart Action.`);
    }

    if (action.type && !_.includes(['bulk', 'global', 'single'], action.type)) {
      logger.warn(`Please set a valid Smart Action type ("bulk", "global" or "single") for the "${action.name}" Smart Action.`);
    }

    setDefaultValueIfNecessary(action, 'endpoint', `/forest/actions/${_.kebabCase(action.name)}`);
    setDefaultValueIfNecessary(action, 'httpMethod', 'POST');
    setDefaultValueIfNecessary(action, 'fields', []);
    setDefaultValueIfNecessary(action, 'redirect', null);
    setDefaultValueIfNecessary(action, 'baseUrl', null);
    setDefaultValueIfNecessary(action, 'type', 'bulk');
    setDefaultValueIfNecessary(action, 'download', false);

    // NOTICE: Set a position to the Smart Actions fields.
    action.fields = action.fields.filter(field => field.field);
    _.each(action.fields, (field, position) => {
      field.position = position;

      if (field.defaultValue === undefined) {
        field.defaultValue = null;
      }
      setDefaultValueIfNecessary(field, 'type', 'String');
      setDefaultValueIfNecessary(field, 'isRequired', false);
      setDefaultValueIfNecessary(field, 'description', null);
      setDefaultValueIfNecessary(field, 'reference', null);
      setDefaultValueIfNecessary(field, 'enums', null);
      setDefaultValueIfNecessary(field, 'widget', null);
    });
  });

  return actions;
};
const cleanCollection = (collection) => {
  if (_.isNil(collection.isSearchable)) {
    collection.isSearchable = true;
  }
  setDefaultValueIfNecessary(collection, 'onlyForRelationships', false);
  setDefaultValueIfNecessary(collection, 'isVirtual', false);
  setDefaultValueIfNecessary(collection, 'isReadOnly', false);
  setDefaultValueIfNecessary(collection, 'paginationType', 'page');
  setDefaultValueIfNecessary(collection, 'icon', null);
  setDefaultValueIfNecessary(collection, 'nameOld', collection.name);
  setDefaultValueIfNecessary(collection, 'searchFields', null);
  setDefaultValueIfNecessary(collection, 'fields', []);
  setDefaultValueIfNecessary(collection, 'segments', []);
  setDefaultValueIfNecessary(collection, 'actions', []);

  collection.fields = cleanFields(collection.fields);
  collection.segments = cleanSegments(collection.segments);
  collection.actions = cleanActions(collection.actions);
};

module.exports = {
  schemas: {},
  perform(implementation, integrator, models, opts) {
    const that = this;
    return P
      .each(models, model =>
        new implementation.SchemaAdapter(model, opts)
          .then((schema) => {
            integrator.defineFields(model, schema);
            integrator.defineSegments(model, schema);
            schema.isSearchable = true;
            return schema;
          })
          .then((schema) => {
            cleanCollection(schema);
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
  cleanCollection,
  cleanActions,
  cleanSegments,
  cleanFields,
};
