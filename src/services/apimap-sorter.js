const _ = require('lodash');
const logger = require('../services/logger');

function ApimapSorter(apimap) {
  function sortArrayOfObjects(array) {
    return _.sortBy(array, ['type', 'id']);
  }

  function sortArrayOfFields(array) {
    return _.sortBy(array, ['field', 'type']);
  }

  function reorderKeysBasic(object) {
    const objectReordered = {};

    _.each(_.sortBy(Object.keys(object)), (key) => {
      objectReordered[key] = object[key];
    });

    return objectReordered;
  }

  function reorderKeysChild(object) {
    const objectReorderedStart = {
      type: object.type,
      id: object.id,
      attributes: object.attributes,
    };

    return Object.assign(objectReorderedStart, object);
  }

  function reorderKeysCollection(collection) {
    const collectionReorderedStart = {
      name: collection.name,
    };

    const collectionReorderedEnd = collection.fields ? { fields: collection.fields } : {};

    delete collection.name;
    delete collection.fields;

    collection = reorderKeysBasic(collection);

    return Object.assign(collectionReorderedStart, collection, collectionReorderedEnd);
  }

  function reorderKeysField(field) {
    const fieldReorderedStart = {
      field: field.field,
      type: field.type,
    };

    delete field.fields;
    delete field.type;

    field = reorderKeysBasic(field);

    return Object.assign(fieldReorderedStart, field);
  }

  this.perform = () => {
    try {
      apimap = reorderKeysBasic(apimap);
      apimap.data = sortArrayOfObjects(apimap.data);

      apimap.data = apimap.data.map((collection) => {
        collection = reorderKeysChild(collection);
        collection.attributes = reorderKeysCollection(collection.attributes);
        if (collection.attributes.fields) {
          collection.attributes.fields = sortArrayOfFields(collection.attributes.fields);
          collection.attributes.fields = collection.attributes.fields
            .map((field) => reorderKeysField(field));
        }
        return collection;
      });

      if (apimap.included) {
        apimap.included = sortArrayOfObjects(apimap.included);

        apimap.included = apimap.included.map((include) => {
          include = reorderKeysChild(include);
          include.attributes = reorderKeysCollection(include.attributes);
          if (include.attributes.fields) {
            include.attributes.fields = sortArrayOfFields(include.attributes.fields);
            include.attributes.fields = include.attributes.fields
              .map((field) => reorderKeysField(field));
          }
          return include;
        });
      }

      apimap.meta = reorderKeysBasic(apimap.meta);

      return apimap;
    } catch (error) {
      logger.warn('An Apimap reordering issue occured:', error);
      return apimap;
    }
  };
}

module.exports = ApimapSorter;
