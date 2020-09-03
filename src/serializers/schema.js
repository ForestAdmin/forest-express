const _ = require('lodash');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const ApimapSorter = require('../services/apimap-sorter');

// NOTICE: If a modification is made here, don't forget to replicate it in the toolbelt.
function SchemaSerializer() {
  // WARNING: Attributes declaration order is important for .forestadmin-schema.json format.
  const options = {
    id: 'name',
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    attributes: [
      'name',
      'nameOld',
      'icon',
      'integration',
      'isReadOnly',
      'isSearchable',
      'isVirtual',
      'onlyForRelationships',
      'paginationType',
      'fields',
      'segments',
      'actions',
    ],
    fields: {
      attributes: [
        'field',
        'type',
        'column',
        'defaultValue',
        'enums',
        'integration',
        'isFilterable',
        'isPrimaryKey',
        'isReadOnly',
        'isRequired',
        'isSortable',
        'isVirtual',
        'reference',
        'inverseOf',
        'relationship',
        'widget',
        'validations',
      ],
    },
    validations: {
      attributes: [
        'message',
        'type',
        'value',
      ],
    },
    actions: {
      ref: 'id',
      attributes: [
        'name',
        'type',
        'baseUrl',
        'endpoint',
        'httpMethod',
        'redirect',
        'download',
        'fields',
      ],
      fields: {
        attributes: [
          'field',
          'type',
          'defaultValue',
          'enums',
          'isRequired',
          'reference',
          'description',
          'position',
          'widget',
        ],
      },
    },
    segments: {
      ref: 'id',
      attributes: ['name'],
    },
    keyForAttribute: 'camelCase',
  };

  this.options = options;
  this.perform = (collections, meta) => {
    // NOTICE: Action ids are defined concatenating the collection name and the object name to
    //         prevent object id conflicts between collections.
    _.each(collections, (collection) => {
      _.each(collection.actions, (action) => {
        action.id = `${collection.name}.${action.name}`;
      });

      _.each(collection.segments, (segment) => {
        segment.id = `${collection.name}.${segment.name}`;
      });
    });

    options.meta = meta;

    const schema = new JSONAPISerializer('collections', collections, options);

    return new ApimapSorter(schema).perform();
  };
}

module.exports = SchemaSerializer;
