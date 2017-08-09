'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function ConversationsSerializer(conversations, meta) {
  return new JSONAPISerializer('layer-conversations', conversations, {
    attributes: ['lastMessageContent', 'sender', 'lastMessageSentAt',
      'messages', 'participantsCount'],
    messages: {
      ref: 'id',
      ignoreRelationshipData: true,
      included: false,
      nullIfMissing: true,
      relationshipLinks: {
        related: function (dataSet) {
          return {
            href: '/forest/layer_conversations/' + dataSet.id + '/relationships/messages'
          };
        }
      }
    },
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = ConversationsSerializer;


