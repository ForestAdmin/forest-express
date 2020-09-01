const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function serializeIntercomConversations(conversations, collectionName, meta) {
  conversations = conversations.map((conversation) => {
    if (conversation.conversation_message) {
      // NOTICE: Intercom API old version
      conversation.subject = conversation.conversation_message.subject;
      conversation.body = [conversation.conversation_message.body, conversation.link];
    } else {
      // NOTICE: Intercom API v2
      conversation.subject = conversation.source.subject;
      // NOTICE: The Intercom API does not sent all the conversation in a "list" request, only the
      //         first message. So we add suspension points "...".
      conversation.body = [conversation.source.body, '...'];
    }

    if (conversation.assignee) {
      conversation.assignee = conversation.assignee.email;
    }

    return conversation;
  });

  const type = `${collectionName}_intercom_conversations`;

  return new JSONAPISerializer(type, conversations, {
    attributes: ['created_at', 'updated_at', 'open', 'read', 'subject', 'body', 'assignee'],
    keyForAttribute(key) { return key; },
    meta,
  });
}

module.exports = serializeIntercomConversations;
