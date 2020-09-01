const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function serializeCloseioLeadEmails(attributes, collectionName, meta) {
  const type = `${collectionName}_closeio_emails`;

  return new JSONAPISerializer(type, attributes, {
    attributes: ['id', 'status', 'sender', 'subject', 'body_text'],
    keyForAttribute(key) { return key; },
    meta,
  });
}

module.exports = serializeCloseioLeadEmails;
