'use strict';
var path = require('../../../services/path');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function CloseioLeadsSerializer(attributes, collectionName, meta) {
  var type = collectionName + '_closeio_leads';

  return new JSONAPISerializer(type, attributes, {
    attributes: ['url', 'created_by_name', 'display_name', 'status_label',
      'date_created', 'date_updated', 'description', 'emails'],
    emails: {
      ref: 'id',
      included: false,
      ignoreRelationshipData: true,
      nullIfMissing: true,
      relationshipLinks: {
        related: function (dataSet) {
          return {
            href: path.base() + collectionName + '_closeio_leads/' +
              dataSet.id + '/emails'
          };
        }
      }
    },
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = CloseioLeadsSerializer;
