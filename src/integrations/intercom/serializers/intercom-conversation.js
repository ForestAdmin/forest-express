const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function IntercomConversationSerializer(conversation, collectionName) {
  let subject;
  let body;

  if (conversation.conversation_message) {
    subject = conversation.conversation_message.subject;
    body = conversation.conversation_message.body;
  } else {
    subject = conversation.source.subject;
    body = conversation.source.body;
  }

  conversation.subject = subject;
  conversation.body = [body, conversation.link];

  if (conversation.assignee) {
    conversation.assignee = conversation.assignee.email;
  }

  const type = `${collectionName}_intercom_conversations`;

  return new JSONAPISerializer(type, conversation, {
    attributes: ['created_at', 'updated_at', 'open', 'read', 'subject', 'body', 'assignee'],
    keyForAttribute(key) { return key; },
  });
}

module.exports = IntercomConversationSerializer;
