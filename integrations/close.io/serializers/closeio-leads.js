'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var StringsUtil = require('../../../utils/strings');

function CloseioLeadsSerializer(attributes, collectionName, meta) {
  var type = StringsUtil.camelCaseToDashed(collectionName) + '-closeio-leads';

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
          var ret = {
            href: '/forest/' + collectionName + '_closeio_leads/' +
              dataSet.id + '/emails'
          };

          return ret;
        }
      }
    },
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = CloseioLeadsSerializer;
