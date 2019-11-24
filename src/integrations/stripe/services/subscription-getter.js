const P = require('bluebird');

function SubscriptionGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);

  function getSubscription(subscriptionId) {
    return new P((resolve, reject) => {
      stripe.subscriptions.retrieve(subscriptionId, (error, subscription) => {
        if (error) { return reject(error); }
        return resolve(subscription);
      });
    });
  }

  this.perform = () => {
    const {
      collection: collectionModel,
      field: collectionFieldName,
      embeddedPath,
    } = integrationInfo;
    const fieldName = embeddedPath ? `${collectionFieldName}.${embeddedPath}` : collectionFieldName;

    return getSubscription(params.subscriptionId)
      .then((subscription) =>
        Implementation.Stripe.getCustomerByUserField(
          collectionModel,
          fieldName,
          subscription.customer,
        )
          .then((customer) => {
            subscription.customer = customer;
            return subscription;
          }));
  };
}

module.exports = SubscriptionGetter;
