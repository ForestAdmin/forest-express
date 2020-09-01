const _ = require('lodash');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const Schemas = require('../../../generators/schemas');

function serializeCards(cards, collectionName, meta) {
  function getCustomerAttributes() {
    if (!cards.length) { return []; }

    const schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  const customerAttributes = getCustomerAttributes();

  const type = `${collectionName}_stripe_cards`;

  return new JSONAPISerializer(type, cards, {
    attributes: ['last4', 'brand', 'funding', 'exp_month', 'exp_year',
      'country', 'name', 'address_line1', 'address_line2', 'address_city',
      'address_state', 'address_zip', 'address_country', 'cvc_check',
      'customer'],
    customer: {
      ref: 'id',
      attributes: customerAttributes,
    },
    keyForAttribute(key) { return key; },
    typeForAttribute(attr) {
      if (attr === 'customer') { return collectionName; }
      return attr;
    },
    meta,
  });
}

module.exports = serializeCards;
