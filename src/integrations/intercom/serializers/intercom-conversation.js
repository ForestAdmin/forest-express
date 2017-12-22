const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function IntercomConversationSerializer(conversation, collectionName) {
  conversation.subject = conversation.conversation_message.subject;
  conversation.body = [conversation.conversation_message.body,
    conversation.link];

  if (conversation.assignee) {
    conversation.assignee = conversation.assignee.email;
  }

  const type = `${collectionName}_intercom_conversations`;

  return new JSONAPISerializer(type, conversation, {
    attributes: ['created_at', 'updated_at', 'open', 'read', 'subject',
      'body', 'assignee'],
    keyForAttribute(key) { return key; },
  });
}

module.exports = IntercomConversationSerializer;
