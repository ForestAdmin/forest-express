'use strict';
var _ = require('lodash');

exports.createCollections = function (Implementation, apimap,
  collectionAndFieldName) {
  var collectionName = collectionAndFieldName.split('.')[0];
  var collectionDisplayName = _.capitalize(collectionName);

  // jshint camelcase: false
  apimap.push({
    name: collectionName + '_closeio_leads',
    displayName: collectionDisplayName + ' Leads',
    icon: 'closeio',
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    fields: [
      { field: 'url', type: 'String', isSearchable: false, widget: 'link' },
      { field: 'display_name', type: 'String', isSearchable: false },
      { field: 'status_label', type: 'String' },
      { field: 'created_by_name', type: 'String', isSearchable: false },
      { field: 'date_updated', type: 'Date', isSearchable: false },
      { field: 'date_created', type: 'Date', isSearchable: false },
      { field: 'description', type: 'String', isSearchable: false },
      { field: 'emails', type: ['String'], reference: collectionName +
        '_closeio_emails.id' },
    ]
  });

  apimap.push({
    name: collectionName + '_closeio_emails',
    displayName: collectionDisplayName + ' Conversations',
    icon: 'closeio',
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    fields: [
      { field: 'status', type: 'String', isSearchable: false },
      { field: 'sender', type: 'String', isSearchable: false },
      { field: 'subject', type: 'String', isSearchable: false },
      { field: 'body_text', type: 'String', isSearchable: false }
    ]
  });
};

exports.createFields = function (implementation, model, schema) {
  schema.fields.push({
    field: 'lead',
    type: 'String',
    reference: implementation.getModelName(model) + '_closeio_leads.id',
    isSearchable: false,
    integration: 'close.io',
    isVirtual: true,
  });

  if (!schema.actions) { schema.actions = []; }
  schema.actions.push({
    id: implementation.getModelName(model) + '.' + 'Create Close.io lead',
    name: 'Create Close.io lead',
    endpoint: '/forest/' + implementation.getModelName(model) + '_closeio_leads',
    fields: [{
      field: 'Company/Organization Name',
      type: 'String'
    }, {
      field: 'Contact Name',
      type: 'String'
    }]
  });
};
