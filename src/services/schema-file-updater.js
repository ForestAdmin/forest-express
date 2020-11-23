const _ = require('lodash');
const { parameterize } = require('../utils/string');
const { prettyPrint } = require('../utils/json');

class SchemaFileUpdater {
  constructor({ logger, fs }) {
    this.logger = logger;
    this.fs = fs;
  }

  static formatObject(object, attributes) {
    const objectFormated = {};
    const objectOrdered = _.sortBy(
      Object.keys(object),
      (attribute) => attributes.indexOf(attribute),
    );
    _.each(objectOrdered, (attribute) => {
      if (attributes.includes(attribute)) {
        objectFormated[attribute] = object[attribute];
      }
    });
    return objectFormated;
  }

  static setDefaultValueIfNecessary(object, property, value) {
    if (!Object.prototype.hasOwnProperty.call(object, property)) {
      object[property] = value;
    }
  }

  static cleanFields(fields) {
    fields = fields.filter((field) => field.field);
    fields.forEach((field) => {
      if (field.defaultValue === undefined) {
        field.defaultValue = null;
      }
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'type', 'String');
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'isRequired', false);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'isPrimaryKey', false);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'isReadOnly', false);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'isSortable', true);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'isFilterable', true);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'isVirtual', false);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'description', null);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'reference', null);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'inverseOf', null);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'relationships', null);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'enums', null);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'validations', null);
      SchemaFileUpdater.setDefaultValueIfNecessary(field, 'integration', null);

      field.validations = field.validations || [];
      field.validations.forEach((validation) => {
        if (validation.message === undefined) {
          validation.message = null;
        }
        SchemaFileUpdater.setDefaultValueIfNecessary(validation, 'value', null);
      });
    });

    return fields;
  }

  static cleanSegments(segments) {
    return segments.filter((segment) => segment.name);
  }

  cleanActions(actions) {
    actions = actions.filter((action) => action.name);
    actions.forEach((action) => {
      if (action.global) {
        this.logger.warn(`REMOVED OPTION: The support for Smart Action "global" option is now removed. Please set "type: 'global'" instead of "global: true" for the "${action.name}" Smart Action.`);
      }

      if (action.type && !_.includes(['bulk', 'global', 'single'], action.type)) {
        this.logger.warn(`Please set a valid Smart Action type ("bulk", "global" or "single") for the "${action.name}" Smart Action.`);
        action.type = null;
      }

      SchemaFileUpdater.setDefaultValueIfNecessary(action, 'endpoint', `/forest/actions/${parameterize(action.name)}`);
      SchemaFileUpdater.setDefaultValueIfNecessary(action, 'httpMethod', 'POST');
      SchemaFileUpdater.setDefaultValueIfNecessary(action, 'fields', []);
      SchemaFileUpdater.setDefaultValueIfNecessary(action, 'redirect', null);
      SchemaFileUpdater.setDefaultValueIfNecessary(action, 'baseUrl', null);
      SchemaFileUpdater.setDefaultValueIfNecessary(action, 'type', 'bulk');
      SchemaFileUpdater.setDefaultValueIfNecessary(action, 'download', false);

      // NOTICE: Set a position to the Smart Actions fields.
      action.fields = action.fields.filter((field) => field.field);
      _.each(action.fields, (field, position) => {
        field.position = position;

        if (field.defaultValue === undefined) {
          field.defaultValue = null;
        }
        SchemaFileUpdater.setDefaultValueIfNecessary(field, 'type', 'String');
        SchemaFileUpdater.setDefaultValueIfNecessary(field, 'isRequired', false);
        SchemaFileUpdater.setDefaultValueIfNecessary(field, 'description', null);
        SchemaFileUpdater.setDefaultValueIfNecessary(field, 'reference', null);
        SchemaFileUpdater.setDefaultValueIfNecessary(field, 'enums', null);
        SchemaFileUpdater.setDefaultValueIfNecessary(field, 'widget', null);
      });

      SchemaFileUpdater.cleanActionHooks(action);
    });

    return actions;
  }

  static cleanActionHooks(action) {
    const load = Boolean(action.hooks && (typeof action.hooks.load === 'function'));
    const change = action.hooks && action.hooks.change && typeof action.hooks.change === 'object'
      ? Object.keys(action.hooks.change)
      : [];
    action.hooks = { load, change };
  }

  cleanCollection(collection) {
    if (_.isNil(collection.isSearchable)) {
      collection.isSearchable = true;
    }
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'onlyForRelationships', false);
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'isVirtual', false);
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'isReadOnly', false);
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'paginationType', 'page');
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'icon', null);
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'nameOld', collection.name);
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'integration', null);
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'fields', []);
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'segments', []);
    SchemaFileUpdater.setDefaultValueIfNecessary(collection, 'actions', []);

    collection.fields = SchemaFileUpdater.cleanFields(collection.fields);
    collection.segments = SchemaFileUpdater.cleanSegments(collection.segments);
    collection.actions = this.cleanActions(collection.actions);
  }

  static formatFields(collection, serializerOptions) {
    collection.fields = collection.fields || [];
    collection.fields = collection.fields.map((field) => {
      const fieldFormatted = SchemaFileUpdater
        .formatObject(field, serializerOptions.fields.attributes);

      fieldFormatted.validations = fieldFormatted.validations.map((validation) =>
        SchemaFileUpdater.formatObject(validation, serializerOptions.validations.attributes));
      return fieldFormatted;
    });
    collection.fields = _.sortBy(collection.fields, ['field', 'type']);
  }

  static formatSegments(collection, serializerOptions) {
    collection.segments = collection.segments || [];
    collection.segments = collection.segments.map((segment) =>
      SchemaFileUpdater.formatObject(segment, serializerOptions.segments.attributes));
    collection.segments = _.sortBy(collection.segments, ['name']);
  }

  static formatActions(collection, serializerOptions) {
    collection.actions = collection.actions || [];
    collection.actions = collection.actions.map((action) => {
      const actionFormatted = SchemaFileUpdater
        .formatObject(action, serializerOptions.actions.attributes);
      actionFormatted.fields = actionFormatted.fields || [];
      actionFormatted.fields = actionFormatted.fields.map((field) =>
        SchemaFileUpdater.formatObject(field, serializerOptions.actions.fields.attributes));
      return actionFormatted;
    });
    collection.actions = _.sortBy(collection.actions, ['name']);
  }

  update(filename, collections, meta, serializerOptions) {
    collections = collections.map((collection) => {
      this.cleanCollection(collection);
      const collectionFormatted = SchemaFileUpdater
        .formatObject(collection, serializerOptions.attributes);

      SchemaFileUpdater.formatFields(collectionFormatted, serializerOptions);
      SchemaFileUpdater.formatSegments(collectionFormatted, serializerOptions);
      SchemaFileUpdater.formatActions(collectionFormatted, serializerOptions);

      return collectionFormatted;
    });
    collections.sort((collection1, collection2) =>
      collection1.name.localeCompare(collection2.name));

    const schema = { collections, meta };
    this.fs.writeFileSync(filename, prettyPrint(schema));
    return schema;
  }
}

module.exports = SchemaFileUpdater;
