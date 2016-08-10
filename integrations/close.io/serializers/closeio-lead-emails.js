'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var StringsUtil = require('../../../utils/strings');

function CloseioLeadEmailsSerializer(attributes, collectionName, meta) {
  var type = StringsUtil.camelCaseToDashed(collectionName) + '-closeio-emails';

  return new JSONAPISerializer(type, attributes, {
    attributes: ['id', 'status', 'sender', 'subject', 'body_text'],
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = CloseioLeadEmailsSerializer;
