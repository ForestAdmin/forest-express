'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function CloseioLeadEmailsSerializer(attributes, collectionName, meta) {
  var type = collectionName + '_closeio_emails';

  return new JSONAPISerializer(type, attributes, {
    attributes: ['id', 'status', 'sender', 'subject', 'body_text'],
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = CloseioLeadEmailsSerializer;
