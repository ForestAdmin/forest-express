'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../../../generators/schemas');
var StringsUtil = require('../../../utils/strings');

function SubscriptionsSerializer(payments, collectionName, meta) {
  function getCustomerAttributes() {
    if (!payments.length) { return []; }

    var schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  var customerAttributes = getCustomerAttributes();

  payments = payments.map(function (payment) {
    if (payment.created) {
      payment.created =  new Date(payment.created * 1000);
    }

    if (payment.amount) { payment.amount /= 100; }

    return payment;
  });

  var type = StringsUtil.camelCaseToDashed(collectionName) +
    '-stripe-subscriptions';

  return new JSONAPISerializer(type, payments, {
    attributes: ['cancel_at_period_end', 'canceled_at', 'created',
      'current_period_end', 'current_period_start', 'ended_at', 'livemode',
      'quantity', 'start', 'status', 'tax_percent', 'trial_end', 'trial_start',
      'customer'],
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

module.exports = SubscriptionsSerializer;

