const _ = require('lodash');
const pushIntoApimap = require('../../utils/integrations').pushIntoApimap;

const INTEGRATION_NAME = 'close.io';

exports.createCollections = function (Implementation, apimap,
  collectionAndFieldName) {
  var collectionName = collectionAndFieldName.split('.')[0];
  var collectionDisplayName = _.capitalize(collectionName);

  // jshint camelcase: false
  pushIntoApimap(apimap, {
    name: collectionName + '_closeio_leads',
    displayName: collectionDisplayName + ' Leads',
    icon: 'closeio',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    fields: [
      { field: 'url', type: 'String', isFilterable: false, widget: 'link' },
      { field: 'display_name', type: 'String', isFilterable: false },
      { field: 'status_label', type: 'String' },
      { field: 'created_by_name', type: 'String', isFilterable: false },
      { field: 'date_updated', type: 'Date', isFilterable: false },
      { field: 'date_created', type: 'Date', isFilterable: false },
      { field: 'description', type: 'String', isFilterable: false },
      { field: 'emails', type: ['String'], reference: collectionName +
        '_closeio_emails.id' },
    ]
  });

  pushIntoApimap(apimap, {
    name: collectionName + '_closeio_emails',
    displayName: collectionDisplayName + ' Conversations',
    icon: 'closeio',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    fields: [
      { field: 'status', type: 'String', isFilterable: false },
      { field: 'sender', type: 'String', isFilterable: false },
      { field: 'subject', type: 'String', isFilterable: false },
      { field: 'body_text', type: 'String', isFilterable: false }
    ]
  });
};

exports.createFields = function (implementation, model, schema) {
  schema.fields.push({
    field: 'lead',
    type: 'String',
    reference: implementation.getModelName(model) + '_closeio_leads.id',
    isFilterable: false,
    integration: INTEGRATION_NAME,
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
