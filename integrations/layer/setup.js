'use strict';

var INTEGRATION_NAME = 'layer';

exports.createCollections = function (Implementation, apimap) {
  apimap.push({
    name: 'layer_conversations',
    displayName: 'Conversations',
    icon: 'layer',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'lastMessageContent', type: 'String', isSearchable: false },
      { field: 'sender', type: 'String', isSearchable: false },
      { field: 'lastMessageSentAt', type: 'Date', isSearchable: false },
      { field: 'messages', type: ['String'], reference: 'layer_messages.id'},
      { field: 'participantsCount', type: 'Number', isSearchable: false }
    ],
    actions: []
  }, {
    name: 'layer_messages',
    displayName: 'Messages',
    icon: 'layer',
    integration: INTEGRATION_NAME,
    onlyForRelationships: true,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'sender', type: 'String', isSearchable: false },
      { field: 'senderAvatar', type: 'String', isSearchable: false },
      { field: 'sentAt', type: 'Date', isSearchable: false },
      { field: 'content', type: 'String', isSearchable: false },
      { field: 'mimeType', type: 'String', isSearchable: false }
    ],
    actions: []
  });
};

exports.createFields = function () {};
