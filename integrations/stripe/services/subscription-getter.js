'use strict';
var P = require('bluebird');

function SubscriptionGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);

  function getSubscription(subscriptionId) {
    return new P(function (resolve, reject) {
      stripe.subscriptions.retrieve(subscriptionId, function (error, subscription) {
        if (error) { return reject(error); }
        resolve(subscription);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    var collectionModel = integrationInfo.collection;

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

module.exports = SubscriptionGetter;
