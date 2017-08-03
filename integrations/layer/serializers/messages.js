'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function MessagesSerializer(messages, meta) {
  return new JSONAPISerializer('layer-messages', messages, {
    attributes: ['sender', 'senderAvatar', 'sentAt', 'content', 'mimeType'],
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = MessagesSerializer;


