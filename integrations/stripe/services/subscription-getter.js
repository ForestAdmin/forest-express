'use strict';
var P = require('bluebird');

function SubscriptionsGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

  function getSubscription(subscriptionId) {
    return new P(function (resolve, reject) {
      stripe.subscriptions.retrieve(subscriptionId, function (err, subscription) {
        if (err) { return reject(err); }
        resolve(subscription);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return getSubscription(params.subscriptionId)
      .then(function (subscription) {
        return Implementation.Stripe.getCustomerByUserField(
          collectionModel, collectionFieldName, subscription.customer)
          .then(function (customer) {
            subscription.customer = customer;
            return subscription;
          });
      });
  };
}

module.exports = SubscriptionsGetter;
