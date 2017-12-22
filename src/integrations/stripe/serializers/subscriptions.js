const _ = require('lodash');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const Schemas = require('../../../generators/schemas');

function SubscriptionsSerializer(subscriptions, collectionName, meta) {
  function getCustomerAttributes() {
    if (!subscriptions.length) { return []; }

    const schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  function format(subscription) {
    if (subscription.canceled_at) {
      subscription.canceled_at = new Date(subscription.canceled_at * 1000);
    }

    if (subscription.created) {
      subscription.created = new Date(subscription.created * 1000);
    }

    if (subscription.current_period_end) {
      subscription.current_period_end =
        new Date(subscription.current_period_end * 1000);
    }

    if (subscription.current_period_start) {
      subscription.current_period_start =
        new Date(subscription.current_period_start * 1000);
    }

    if (subscription.ended_at) {
      subscription.ended_at =
        new Date(subscription.ended_at * 1000);
    }

    if (subscription.start) {
      subscription.start = new Date(subscription.start * 1000);
    }

    if (subscription.trial_end) {
      subscription.trial_end = new Date(subscription.trial_end * 1000);
    }

    if (subscription.trial_start) {
      subscription.trial_start = new Date(subscription.trial_start * 1000);
    }

    return subscription;
  }

  const customerAttributes = getCustomerAttributes();

  if (subscriptions.length) {
    subscriptions = subscriptions.map(format);
  } else {
    subscriptions = format(subscriptions);
  }

  const type = `${collectionName}_stripe_subscriptions`;

  return new JSONAPISerializer(type, subscriptions, {
    attributes: ['cancel_at_period_end', 'canceled_at', 'created',
      'current_period_end', 'current_period_start', 'ended_at', 'livemode',
      'quantity', 'start', 'status', 'tax_percent', 'trial_end', 'trial_start',
      'customer'],
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

module.exports = SubscriptionsSerializer;
