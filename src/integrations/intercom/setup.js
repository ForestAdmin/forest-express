const _ = require('lodash');
const { pushIntoApimap } = require('../../utils/integrations');

const INTEGRATION_NAME = 'intercom';

exports.createCollections = function (Implementation, apimap, collectionName) {
  const collectionDisplayName = _.capitalize(collectionName);
  const model = Implementation.getModels()[collectionName];
  // jshint camelcase: false
  pushIntoApimap(apimap, {
    name: `${Implementation.getModelName(model)}_intercom_conversations`,
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: `${Implementation.getModelNameOld(model)}_intercom_conversations`,
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
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: `${Implementation.getModelNameOld(model)}_intercom_attributes`,
    displayName: `${collectionDisplayName} Attributes`,
    icon: 'intercom',
    integration: INTEGRATION_NAME,
    onlyForRelationships: true,
    isVirtual: true,
    isReadOnly: true,
    fields: [
      { field: 'created_at', type: 'Date', isFilterable: false },
      { field: 'updated_at', type: 'Date', isFilterable: false },
      { field: 'session_count', type: 'Number', isFilterable: false },
      { field: 'last_seen_ip', type: 'String', isFilterable: false },
      { field: 'signed_up_at', type: 'Date', isFilterable: false },
      { field: 'country', type: 'String', isFilterable: false },
      { field: 'city', type: 'String', isFilterable: false },
      { field: 'browser', type: 'String', isFilterable: false },
      { field: 'platform', type: 'String', isFilterable: false },
      { field: 'companies', type: 'String', isFilterable: false },
      { field: 'segments', type: 'String', isFilterable: false },
      { field: 'tags', type: 'String', isFilterable: false },
      {
        field: 'geoloc',
        type: 'String',
        widget: 'map',
        isFilterable: false,
      },
    ],
  });
};

exports.createFields = function (implementation, model, schemaFields) {
  schemaFields.push({
    field: 'intercom_conversations',
    type: ['String'],
    reference: `${implementation.getModelName(model)
    }_intercom_conversations.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
  });

  schemaFields.push({
    field: 'intercom_attributes',
    type: 'String',
    reference: `${implementation.getModelName(model)
    }_intercom_attributes.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
  });
};
