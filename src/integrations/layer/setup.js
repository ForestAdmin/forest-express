const _ = require('lodash');
const pushIntoApimap = require('../../utils/integrations').pushIntoApimap;

const INTEGRATION_NAME = 'layer';

exports.createCollections = function (Implementation, apimap,
  collectionAndFieldName) {

  // jshint camelcase: false
  var collectionName = collectionAndFieldName.split('.')[0];
  var model = Implementation.getModels()[collectionName];
  var referenceName = Implementation.getModelName(model) + '.id';
  var collectionDisplayName = _.capitalize(collectionName);

  pushIntoApimap(apimap, {
    name: Implementation.getModelName(model) + '_layer_conversations',
    displayName: collectionDisplayName + ' Conversations',
    icon: 'layer',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isFilterable: false },
      { field: 'title', type: 'String', isFilterable: false },
      { field: 'createdAt', type: 'Date', isFilterable: false },
      {
        field: 'lastMessage',
        type: 'String',
        reference: Implementation.getModelName(model) + '_layer_messages',
        isFilterable: false
      },
      {
        field: 'messages',
        type: ['String'],
        reference: Implementation.getModelName(model) + '_layer_messages',
        isFilterable: false
      },
      {
        field: 'participants',
        type: ['String'],
        reference: referenceName,
        isFilterable: false
      }
    ]
  });

  pushIntoApimap(apimap, {
    name: Implementation.getModelName(model) + '_layer_messages',
    displayName: collectionDisplayName + ' Messages',
    icon: 'layer',
    integration: INTEGRATION_NAME,
    onlyForRelationships: true,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isFilterable: false },
      { field: 'sender', type: 'String', isFilterable: false },
      { field: 'sentAt', type: 'Date', isFilterable: false },
      { field: 'content', type: 'String', isFilterable: false },
      { field: 'mimeType', type: 'String', isFilterable: false }
    ],
    actions: []
  });
};

exports.createFields = function (Implementation, model, schemaFields) {
  schemaFields.push({
    field: 'layer_conversations',
    displayName: 'Conversations',
    type: ['String'],
    reference: Implementation.getModelName(model) + '_layer_conversations.id',
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME
  });
};
