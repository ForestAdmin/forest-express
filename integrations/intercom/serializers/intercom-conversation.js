'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var StringsUtil = require('../../../utils/strings');

function IntercomConversationSerializer(conversation, collectionName) {
  // jshint camelcase: false
  conversation.subject =  conversation.conversation_message.subject;
  conversation.body = [conversation.conversation_message.body,
    conversation.link];

  if (conversation.assignee) {
    conversation.assignee =  conversation.assignee.email;
  }

  var type = StringsUtil.camelCaseToDashed(collectionName) + '-intercom-conversations';

  return new JSONAPISerializer(type, conversation, {
    attributes: ['created_at', 'updated_at', 'open', 'read', 'subject',
      'body', 'assignee'],
    keyForAttribute: function (key) { return key; }
  });
}

module.exports = IntercomConversationSerializer;
