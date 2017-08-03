'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function ConversationsSerializer(conversation) {
  return new JSONAPISerializer('layer-conversations', conversation, {
    attributes: ['lastMessageContent', 'sender', 'lastMessageSentAt',
      'participantsCount'],
    keyForAttribute: function (key) { return key; },
  });
}

module.exports = ConversationsSerializer;


