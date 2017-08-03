'use strict';
var _ = require('lodash');

var INTEGRATION_NAME = 'layer';

exports.createCollections = function (Implementation, apimap,
  collectionAndFieldName) {

  // jshint camelcase: false
  var collectionName = collectionAndFieldName.split('.')[0];
  var model = Implementation.getModels()[collectionName];
  var referenceName = Implementation.getModelName(model) + '.id';
  var collectionDisplayName = _.capitalize(collectionName);

  apimap.push({
    name: Implementation.getModelName(model) + '_layer_conversations',
    displayName: collectionDisplayName + ' Conversations',
    icon: 'layer',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'title', type: 'String', isSearchable: false },
      { field: 'createdAt', type: 'Date', isSearchable: false },
      {
        field: 'lastMessage',
        type: 'String',
        reference: Implementation.getModelName(model) + '_layer_messages',
        isSearchable: false
      },
      {
        field: 'messages',
        type: ['String'],
        reference: Implementation.getModelName(model) + '_layer_messages',
        isSearchable: false
      },
      {
        field: 'participants',
        type: ['String'],
        reference: referenceName,
        isSearchable: false
      }
    ]
  });

  apimap.push({
    name: Implementation.getModelName(model) + '_layer_messages',
    displayName: collectionDisplayName + ' Messages',
    icon: 'layer',
    integration: INTEGRATION_NAME,
    onlyForRelationships: true,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'sender', type: 'String', isSearchable: false },
      { field: 'sentAt', type: 'Date', isSearchable: false },
      { field: 'content', type: 'String', isSearchable: false },
      { field: 'mimeType', type: 'String', isSearchable: false }
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
    isSearchable: false,
    integration: INTEGRATION_NAME
  });
};
