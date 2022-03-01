const { inject } = require('@forestadmin/context');
const _ = require('lodash');
const { pushIntoApimap } = require('../../utils/integrations');

const INTEGRATION_NAME = 'intercom';

exports.createCollections = (Implementation, apimap, collectionName) => {
  const { modelsManager } = inject();
  const collectionDisplayName = _.capitalize(collectionName);
  const model = modelsManager.getModels()[collectionName];
  // jshint camelcase: false
  pushIntoApimap(apimap, {
    name: `${Implementation.getModelName(model)}_intercom_conversations`,
    displayName: `${collectionDisplayName} Conversations`,
    icon: 'intercom',
    integration: INTEGRATION_NAME,
    onlyForRelationships: true,
    isVirtual: true,
    isReadOnly: true,
    fields: [
      { field: 'subject', type: 'String' },
      { field: 'body', type: ['String'] },
      { field: 'open', type: 'Boolean' },
      { field: 'read', type: 'Boolean' },
      { field: 'assignee', type: 'String' },
    ],
  });

  pushIntoApimap(apimap, {
    name: `${Implementation.getModelName(model)}_intercom_attributes`,
    displayName: `${collectionDisplayName} Attributes`,
    icon: 'intercom',
    integration: INTEGRATION_NAME,
    onlyForRelationships: true,
    isVirtual: true,
    isReadOnly: true,
    fields: [
      { field: 'email', type: 'String', isFilterable: false },
      { field: 'name', type: 'String', isFilterable: false },
      { field: 'role', type: 'String', isFilterable: false },
      { field: 'companies', type: ['String'], isFilterable: false },
      { field: 'tags', type: ['String'], isFilterable: false },
      { field: 'platform', type: 'String', isFilterable: false },
      { field: 'browser', type: 'String', isFilterable: false },
      { field: 'city', type: 'String', isFilterable: false },
      { field: 'country', type: 'String', isFilterable: false },
      { field: 'signed_up_at', type: 'Date', isFilterable: false },
      { field: 'last_request_at', type: 'Date', isFilterable: false },
      { field: 'last_seen_at', type: 'Date', isFilterable: false },
      { field: 'last_replied_at', type: 'Date', isFilterable: false },
      { field: 'last_contacted_at', type: 'Date', isFilterable: false },
      { field: 'last_email_opened_at', type: 'Date', isFilterable: false },
      { field: 'last_email_clicked_at', type: 'Date', isFilterable: false },
      { field: 'created_at', type: 'Date', isFilterable: false },
      { field: 'updated_at', type: 'Date', isFilterable: false },
    ],
  });
};

exports.createFields = (implementation, model, schemaFields) => {
  schemaFields.push({
    field: 'intercom_conversations',
    type: ['String'],
    reference: `${implementation.getModelName(model)
    }_intercom_conversations.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
    isVirtual: true,
  });

  schemaFields.push({
    field: 'intercom_attributes',
    type: 'String',
    reference: `${implementation.getModelName(model)
    }_intercom_attributes.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
    isVirtual: true,
  });
};
