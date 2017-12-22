const _ = require('lodash');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function MessagesSerializer(messages, collectionName, meta) {
  function mapMessage(message) {
    message.id = message.id.replace('layer:///messages/', '');
    message.sentAt = message.sent_at;
    message.content = message.parts[0].body;
    message.mimeType = message.parts[0].mime_type;
    message.sender = message.sender.display_name;

    return message;
  }

  let data = null;
  if (_.isArray(messages)) {
    data = messages.map(message => mapMessage(message));
  } else {
    data = mapMessage(messages);
  }

  const type = `${collectionName}_layer_messages`;

  return new JSONAPISerializer(type, data, {
    attributes: ['sender', 'sentAt', 'content', 'mimeType'],
    keyForAttribute(key) { return key; },
    meta,
  });
}

module.exports = MessagesSerializer;
