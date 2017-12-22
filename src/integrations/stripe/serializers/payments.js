'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../../../generators/schemas');

function PaymentsSerializer(payments, collectionName, meta) {
  function getCustomerAttributes() {
    if (!payments.length) { return []; }

    var schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  function format(payment) {
    if (payment.created) {
      payment.created =  new Date(payment.created * 1000);
    }

    if (payment.amount) { payment.amount /= 100; }

    return payment;
  }

  var customerAttributes = getCustomerAttributes();

  if (payments.length) {
    payments = payments.map(format);
  } else {
    payments = format(payments);
  }

  var type = collectionName + '_stripe_payments';

  return new JSONAPISerializer(type, payments, {
    attributes: ['created', 'status', 'amount', 'currency', 'refunded',
      'customer', 'description'],
    customer: {
      ref: Schemas.schemas[collectionName].idField,
      attributes: customerAttributes
    },
    keyForAttribute: function (key) { return key; },
    typeForAttribute: function (attr) {
      if (attr === 'customer') { return collectionName; }
      return attr;
    },
    meta: meta
  });
}

module.exports = PaymentsSerializer;
