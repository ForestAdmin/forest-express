const _ = require('lodash');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const Schemas = require('../../../generators/schemas');

function serializePayments(payments, collectionName, meta) {
  function getCustomerAttributes() {
    if (!payments.length) { return []; }

    const schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  function format(payment) {
    if (payment.created) {
      payment.created = new Date(payment.created * 1000);
    }

    if (payment.amount) { payment.amount /= 100; }

    return payment;
  }

  const customerAttributes = getCustomerAttributes();

  if (payments.length) {
    payments = payments.map(format);
  } else {
    payments = format(payments);
  }

  const type = `${collectionName}_stripe_payments`;

  return new JSONAPISerializer(type, payments, {
    attributes: ['created', 'status', 'amount', 'currency', 'refunded',
      'customer', 'description'],
    customer: {
      ref: Schemas.schemas[collectionName].idField,
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

module.exports = serializePayments;
