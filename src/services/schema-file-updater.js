const _ = require('lodash');
const fs = require('fs');
const logger = require('../services/logger');
const { parameterize } = require('../utils/string');
const { prettyPrint } = require('../utils/json');

function SchemaFileUpdater(filename, collections, meta, serializerOptions) {
  const formatObject = (object, attributes) => {
    const objectFormated = {};
    const objectOrdered = _.sortBy(
      Object.keys(object),
      attribute => attributes.indexOf(attribute),
    );
    _.each(objectOrdered, (attribute) => {
      if (attributes.includes(attribute)) {
        objectFormated[attribute] = object[attribute];
      }
    });
    return objectFormated;
  };

  function setDefaultValueIfNecessary(object, property, value) {
    if (!Object.prototype.hasOwnProperty.call(object, property)) {
      object[property] = value;
    }
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
      setDefaultValueIfNecessary(field, 'isSortable', true);
      setDefaultValueIfNecessary(field, 'isFilterable', true);
      setDefaultValueIfNecessary(field, 'isVirtual', false);
      setDefaultValueIfNecessary(field, 'description', null);
      setDefaultValueIfNecessary(field, 'reference', null);
      setDefaultValueIfNecessary(field, 'inverseOf', null);
      setDefaultValueIfNecessary(field, 'relationships', null);
      setDefaultValueIfNecessary(field, 'enums', null);
      setDefaultValueIfNecessary(field, 'validations', null);
      setDefaultValueIfNecessary(field, 'integration', null);

      field.validations = field.validations || [];
      field.validations.forEach((validation) => {
        if (validation.message === undefined) {
          validation.message = null;
        }
        setDefaultValueIfNecessary(validation, 'value', null);
      });
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
        action.type = null;
      }

      setDefaultValueIfNecessary(action, 'endpoint', `/forest/actions/${parameterize(action.name)}`);
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
    setDefaultValueIfNecessary(collection, 'integration', null);
    setDefaultValueIfNecessary(collection, 'fields', []);
    setDefaultValueIfNecessary(collection, 'segments', []);
    setDefaultValueIfNecessary(collection, 'actions', []);

    collection.fields = cleanFields(collection.fields);
    collection.segments = cleanSegments(collection.segments);
    collection.actions = cleanActions(collection.actions);
  };

  this.perform = () => {
    collections = collections.map((collection) => {
      cleanCollection(collection);
      const collectionFormatted = formatObject(collection, serializerOptions.attributes);

      collectionFormatted.fields = collectionFormatted.fields || [];
      collectionFormatted.fields = collectionFormatted.fields.map((field) => {
        const fieldFormatted = formatObject(field, serializerOptions.fields.attributes);

        fieldFormatted.validations = fieldFormatted.validations.map(validation =>
          formatObject(validation, serializerOptions.validations.attributes));
        return fieldFormatted;
      });
      collectionFormatted.fields = _.sortBy(collectionFormatted.fields, ['field', 'type']);

      collectionFormatted.segments = collectionFormatted.segments || [];
      collectionFormatted.segments = collectionFormatted.segments.map(segment =>
        formatObject(segment, serializerOptions.segments.attributes));
      collectionFormatted.segments = _.sortBy(collectionFormatted.segments, ['name']);

      collectionFormatted.actions = collectionFormatted.actions || [];
      collectionFormatted.actions = collectionFormatted.actions.map((action) => {
        const actionFormatted = formatObject(action, serializerOptions.actions.attributes);
        actionFormatted.fields = actionFormatted.fields || [];
        actionFormatted.fields = actionFormatted.fields.map(field =>
          formatObject(field, serializerOptions.actions.fields.attributes));
        return actionFormatted;
      });
      collectionFormatted.actions = _.sortBy(collectionFormatted.actions, ['name']);

      return collectionFormatted;
    });
    collections.sort((collection1, collection2) =>
      collection1.name.localeCompare(collection2.name));

    const schema = { collections, meta };
    fs.writeFileSync(filename, prettyPrint(schema));
    return schema;
  };
}

module.exports = SchemaFileUpdater;
