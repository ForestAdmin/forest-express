'use strict';
var _ = require('lodash');

exports.createCollections = function (Implementation, apimap, collectionName) {

  var collectionDisplayName = _.capitalize(collectionName);
  // jshint camelcase: false
  apimap.push({
    name: collectionName + '_intercom_conversations',
    displayName: collectionDisplayName + ' Conversations',
    icon: 'intercom',
    onlyForRelationships: true,
    isVirtual: true,
    isReadOnly: true,
    fields: [
      { field: 'subject', type: 'String' },
      { field: 'body', type: ['String'], widget: 'link' },
      { field: 'open', type: 'Boolean'},
      { field: 'read', type: 'Boolean'},
      { field: 'assignee', type: 'String' }
    ]
  });

  apimap.push({
    name: collectionName + '_intercom_attributes',
    displayName: collectionDisplayName + ' Attributes',
    icon: 'intercom',
    onlyForRelationships: true,
    isVirtual: true,
    isReadOnly: true,
    fields: [
      { field: 'created_at', type: 'Date', isSearchable: false },
      { field: 'updated_at', type: 'Date', isSearchable: false  },
      { field: 'session_count', type: 'Number', isSearchable: false  },
      { field: 'last_seen_ip', type: 'String', isSearchable: false  },
      { field: 'signed_up_at', type: 'Date', isSearchable: false  },
      { field: 'country', type: 'String', isSearchable: false  },
      { field: 'city', type: 'String', isSearchable: false  },
      { field: 'browser', type: 'String', isSearchable: false  },
      { field: 'platform', type: 'String', isSearchable: false  },
      { field: 'companies', type: 'String', isSearchable: false  },
      { field: 'segments', type: 'String', isSearchable: false  },
      { field: 'tags', type: 'String', isSearchable: false  },
      {
        field: 'geoloc',
        type: 'String',
        widget: 'google map',
        isSearchable: false
      }
    ]
  });

};

exports.createFields = function (implementation, model, schemaFields) {
  schemaFields.push({
    field: 'intercom_conversations',
    type: ['String'],
    reference: implementation.getModelName(model) +
      '_intercom_conversations.id',
    column: null,
    isSearchable: false,
    integration: 'intercom'
  });

  schemaFields.push({
    field: 'intercom_attributes',
    type: 'String',
    reference: implementation.getModelName(model) +
      '_intercom_attributes.id',
    column: null,
    isSearchable: false,
    integration: 'intercom'
  });
};
