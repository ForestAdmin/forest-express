const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function IntercomConversationSerializer(conversation, collectionName) {
  if (conversation.conversation_message) {
    // NOTICE: Intercom API old version
    conversation.subject = conversation.conversation_message.subject;
    conversation.body = [conversation.conversation_message.body, conversation.link];
  } else {
    // NOTICE: Intercom API v2
    conversation.subject = conversation.source.subject;
    // NOTICE: Add all (except the first one) messages of the conversation.
    conversation.body = conversation.conversation_parts.conversation_parts
      .map((part) => part.body);
    // NOTICE: Add the first message of the conversation.
    conversation.body.unshift(conversation.source.body);
  }

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
