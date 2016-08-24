'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var StringsUtil = require('../utils/strings');

function IntercomConversationsSerializer(conversations, collectionName, meta) {
  conversations = conversations.map(function (conversation) {
    // jshint camelcase: false
    conversation.subject =  conversation.conversation_message.subject;
    conversation.body = [conversation.conversation_message.body,
      conversation.link];

    if (conversation.assignee) {
      conversation.assignee =  conversation.assignee.email;
    }

    return conversation;
  });

  var type = StringsUtil.camelCaseToDashed(collectionName) +
                                           '-intercom-conversations';

  return new JSONAPISerializer(type, conversations, {
    attributes: ['created_at', 'updated_at', 'open', 'read', 'subject',
      'body', 'assignee'],
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = IntercomConversationsSerializer;
