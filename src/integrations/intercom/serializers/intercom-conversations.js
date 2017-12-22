const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function IntercomConversationsSerializer(conversations, collectionName, meta) {
  conversations = conversations.map((conversation) => {
    conversation.subject = conversation.conversation_message.subject;
    conversation.body = [conversation.conversation_message.body,
      conversation.link];

    if (conversation.assignee) {
      conversation.assignee = conversation.assignee.email;
    }

    return conversation;
  });

  const type = `${collectionName}_intercom_conversations`;

  return new JSONAPISerializer(type, conversations, {
    attributes: ['created_at', 'updated_at', 'open', 'read', 'subject',
      'body', 'assignee'],
    keyForAttribute(key) { return key; },
    meta,
  });
}

module.exports = IntercomConversationsSerializer;
