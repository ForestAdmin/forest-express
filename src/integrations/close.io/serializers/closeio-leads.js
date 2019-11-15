
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function CloseioLeadsSerializer(attributes, collectionName, meta) {
  const type = `${collectionName}_closeio_leads`;

  return new JSONAPISerializer(type, attributes, {
    attributes: ['url', 'created_by_name', 'display_name', 'status_label',
      'date_created', 'date_updated', 'description', 'emails'],
    emails: {
      ref: 'id',
      included: false,
      ignoreRelationshipData: true,
      nullIfMissing: true,
      relationshipLinks: {
        related(dataSet) {
          return {
            href: `/forest/${collectionName}_closeio_leads/${
              dataSet.id}/emails`,
          };
        },
      },
    },
    keyForAttribute(key) { return key; },
    meta,
  });
}

module.exports = CloseioLeadsSerializer;
