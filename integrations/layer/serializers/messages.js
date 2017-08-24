'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var StringsUtil = require('../../../utils/strings');

function MessagesSerializer(messages, collectionName, meta) {
  function mapMessage(message) {
    // jshint camelcase: false
    message.id = message.id.replace('layer:///messages/', '');
    message.sentAt = message.sent_at;
    message.content = message.parts[0].body;
    message.mimeType = message.parts[0].mime_type;
    message.sender = message.sender.display_name;

    return message;
  }

  var data = null;
  if (_.isArray(messages)) {
    data = messages.map(function (message) {
      return mapMessage(message);
    });
  } else {
    data = mapMessage(messages);
  }

  var type = StringsUtil.camelCaseToDashed(collectionName) + '-layer-messages';

  return new JSONAPISerializer(type, data, {
    attributes: ['sender', 'sentAt', 'content', 'mimeType'],
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = MessagesSerializer;
