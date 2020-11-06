const _ = require('lodash');

class ApimapSorter {
  constructor({ logger }) {
    this.logger = logger;
  }

  static _sortArrayOfObjects(array) {
    return _.sortBy(array, ['type', 'id']);
  }

  static _sortArrayOfFields(array) {
    return _.sortBy(array, ['field', 'type']);
  }

  static _reorderKeysBasic(object) {
    const objectReordered = {};

    _.each(_.sortBy(Object.keys(object)), (key) => {
      objectReordered[key] = object[key];
    });

    return objectReordered;
  }

  static _reorderKeysChild(object) {
    const objectReorderedStart = {
      type: object.type,
      id: object.id,
      attributes: object.attributes,
    };

    return Object.assign(objectReorderedStart, object);
  }

  static _reorderKeysCollection(collection) {
    const collectionReorderedStart = {
      name: collection.name,
    };

    const collectionReorderedEnd = collection.fields ? { fields: collection.fields } : {};

    delete collection.name;
    delete collection.fields;

    collection = ApimapSorter._reorderKeysBasic(collection);

    return Object.assign(collectionReorderedStart, collection, collectionReorderedEnd);
  }

  static _reorderKeysField(field) {
    const fieldReorderedStart = {
      field: field.field,
      type: field.type,
    };

    delete field.fields;
    delete field.type;

    field = ApimapSorter._reorderKeysBasic(field);

    return Object.assign(fieldReorderedStart, field);
  }

  sort(apimap) {
    try {
      apimap = ApimapSorter._reorderKeysBasic(apimap);
      apimap.data = ApimapSorter._sortArrayOfObjects(apimap.data);

      apimap.data = apimap.data.map((collection) => {
        collection = ApimapSorter._reorderKeysChild(collection);
        collection.attributes = ApimapSorter._reorderKeysCollection(collection.attributes);
        if (collection.attributes.fields) {
          collection.attributes.fields = ApimapSorter._sortArrayOfFields(
            collection.attributes.fields,
          );
          collection.attributes.fields = collection.attributes.fields
            .map((field) => ApimapSorter._reorderKeysField(field));
        }
        return collection;
      });

      if (apimap.included) {
        apimap.included = ApimapSorter._sortArrayOfObjects(apimap.included);

        apimap.included = apimap.included.map((include) => {
          include = ApimapSorter._reorderKeysChild(include);
          include.attributes = ApimapSorter._reorderKeysCollection(include.attributes);
          if (include.attributes.fields) {
            include.attributes.fields = ApimapSorter._sortArrayOfFields(include.attributes.fields);
            include.attributes.fields = include.attributes.fields
              .map((field) => ApimapSorter._reorderKeysField(field));
          }
          return include;
        });
      }

      apimap.meta = ApimapSorter._reorderKeysBasic(apimap.meta);

      return apimap;
    } catch (error) {
      this.logger.warn('An Apimap reordering issue occured: ', error);
      return apimap;
    }
  }
}

module.exports = ApimapSorter;
