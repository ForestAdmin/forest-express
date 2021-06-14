const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function serializeIntercomAttributes(attributes, collectionName, meta) {
  const type = `${collectionName}_intercom_attributes`;

  const unixTimestampToDateOrNull = (unixTimestamp) =>
    unixTimestamp && new Date(unixTimestamp * 1000);

  // Attributes keys ending with `_at` are unix timestamp
  // thus they need to be converted to js Date
  Object.entries(attributes).forEach(([attributeKey, attributeValue]) => {
    if (attributeKey.endsWith('_at')) {
      attributes[attributeKey] = unixTimestampToDateOrNull(attributeValue);
    }
  });

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
