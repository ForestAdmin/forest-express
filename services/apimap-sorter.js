'use strict';
var _ = require('lodash');

function ApimapSorter(apimap) {
  function sortArrayOfObjects(array) {
    return _.sortBy(array, ['type', 'id']);
  }

  function sortArrayOfFields(array) {
    return _.sortBy(array, ['field', 'type']);
  }

  function reorderKeysBasic(object) {
    var objectReordered = {};

    _.each(_.sortBy(Object.keys(object)), function(key) {
      objectReordered[key] = object[key];
    });

    return objectReordered;
  }

  function reorderKeysChild(object) {
    var objectReorderedStart = {
      type: object.type,
      id: object.id,
      attributes: object.attributes,
    };

    return Object.assign(objectReorderedStart, object);
  }

  function reorderKeysCollection(collection) {
    var collectionReorderedStart = {
      name: collection.name,
    };

    var collectionReorderedEnd = collection.fields ? { fields: collection.fields } : {};

    delete collection.name;
    delete collection.fields;

    collection = reorderKeysBasic(collection);

    return Object.assign(collectionReorderedStart, collection, collectionReorderedEnd);
  }

  function reorderKeysField(field) {
    var fieldReorderedStart = {
      field: field.field,
      type: field.type,
    };

    delete field.fields;
    delete field.type;

    field = reorderKeysBasic(field);

    return Object.assign(fieldReorderedStart, field);
  }

  this.perform = function() {
    apimap = reorderKeysBasic(apimap);
    apimap.data = sortArrayOfObjects(apimap.data);

    apimap.data = apimap.data.map(function (collection) {
      collection = reorderKeysChild(collection);
      collection.attributes = reorderKeysCollection(collection.attributes);
      collection.attributes.fields = sortArrayOfFields(collection.attributes.fields);
      collection.attributes.fields = collection.attributes.fields
        .map(function (field) { return reorderKeysField(field); });

      return collection;
    });

    if (apimap.included) {
      apimap.included = sortArrayOfObjects(apimap.included);

      apimap.included = apimap.included.map(function (include) {
        include = reorderKeysChild(include);
        include.attributes = reorderKeysCollection(include.attributes);
        include.attributes.fields = sortArrayOfFields(include.attributes.fields);
        include.attributes.fields = include.attributes.fields
          .map(function (field) { return reorderKeysField(field); });
        return include;
      });
    }

    // NOTICE: Order keys in meta
    apimap.meta = reorderKeysBasic(apimap.meta);

    return apimap;
  };
}

module.exports = ApimapSorter;
