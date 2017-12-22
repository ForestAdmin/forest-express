const P = require('bluebird');

function SubscriptionGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);

  function getSubscription(subscriptionId) {
    return new P(((resolve, reject) => {
      stripe.subscriptions.retrieve(subscriptionId, (error, subscription) => {
        if (error) { return reject(error); }
        return resolve(subscription);
      });
    }));
  }

  this.perform = function perform() {
    const collectionFieldName = integrationInfo.field;
    const collectionModel = integrationInfo.collection;

    return getSubscription(params.subscriptionId)
      .then(subscription => Implementation.Stripe
        .getCustomerByUserField(collectionModel, collectionFieldName, subscription.customer)
        .then((customer) => {
          subscription.customer = customer;
          return subscription;
        }));
  };
}

module.exports = SubscriptionGetter;
