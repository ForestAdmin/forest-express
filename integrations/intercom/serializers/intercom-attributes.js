'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function IntercomAttributesSerializer(attributes, collectionName, meta) {
  var type = collectionName + '-intercom-attributes';

  return new JSONAPISerializer(type, attributes, {
    attributes: ['session_count', 'last_seen_ip', 'created_at', 'updated_at',
      'signed_up_at', 'last_request_at', 'country', 'city', 'user_agent',
      'companies', 'segments', 'tags', 'browser', 'platform', 'geoloc'],
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = IntercomAttributesSerializer;
