const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function serializeIntercomAttributes(attributes, collectionName, meta) {
  const type = `${collectionName}_intercom_attributes`;

  return new JSONAPISerializer(type, attributes, {
    attributes: [
      'email',
      'name',
      'role',
      'companies',
      'tags',
      'platform',
      'browser',
      'city',
      'country',
      'signed_up_at',
      'last_request_at',
      'last_seen_at',
      'last_replied_at',
      'last_contacted_at',
      'last_email_opened_at',
      'last_email_clicked_at',
      'created_at',
      'updated_at',
    ],
    keyForAttribute(key) { return key; },
    meta,
  });
}

module.exports = serializeIntercomAttributes;
