'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function ConversationsSerializer(conversations, collectionName, meta) {

  function mapConversation(conversation) {
    // jshint camelcase: false
    conversation.id = conversation.id.replace('layer:///conversations/', '');
    conversation.createdAt = conversation.created_at;

    if (conversation.last_message) {
      conversation.lastMessage = {
        id: conversation.last_message.id.replace('layer:///messages/', ''),
        sentAt: conversation.last_message.sent_at,
        content: conversation.last_message.parts[0].body,
        mimeType: conversation.last_message.parts[0].mime_type,
        sender: conversation.last_message.sender.display_name,
      };
    }

    if (_.isArray(conversation.participants) &&
      conversation.participants.length) {
      conversation.title = conversation.participants.map(function (participant) {
        return participant.display_name;
      }).join(', ');
    }

    return conversation;
  }

  var type = collectionName + '_layer_conversations';
  var data = null;

  if (_.isArray(conversations)) {
    data = conversations.map(function (conversation) {
      return mapConversation(conversation);
    });
  } else {
    data = mapConversation(conversations);
  }

  return new JSONAPISerializer(type, data, {
    attributes: ['title', 'createdAt', 'messages', 'lastMessage'],
    messages: {
      ref: 'id',
      ignoreRelationshipData: true,
      included: false,
      nullIfMissing: true,
      relationshipLinks: {
        related: function (dataSet) {
          return {
            href: '/forest/' + collectionName + '_layer_conversations/' + dataSet.id +
              '/relationships/messages'
          };
        }
      }
    },
    lastMessage: {
      ref: 'id',
      attributes: ['sender', 'sentAt', 'content', 'mimeType']
    },
    keyForAttribute: function (key) { return key; },
    typeForAttribute: function (attribute) {
      if (attribute === 'lastMessage') {
        return collectionName + '_layer_messages';
      }

      return undefined;
    },
    meta: meta
  });
}

module.exports = ConversationsSerializer;
