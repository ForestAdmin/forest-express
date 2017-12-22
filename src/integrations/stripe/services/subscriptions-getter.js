
const P = require('bluebird');

function SubscriptionsGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  let collectionModel = null;

  function hasPagination() {
    return params.page;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
    }
    return 10;
  }

  function getStartingAfter() {
    if (hasPagination() && params.starting_after) {
      return params.starting_after;
    }
  }

  function getEndingBefore() {
    if (hasPagination() && params.ending_before) {
      return params.ending_before;
    }
  }

  function getSubscriptions(query) {
    return new P(((resolve, reject) => {
      stripe.subscriptions.list(query, (err, subcriptions) => {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([subcriptions.total_count, subcriptions.data]);
      });
    }));
  }

  this.perform = function () {
    const collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Stripe.getCustomer(
      collectionModel,
      collectionFieldName, params.recordId,
    )
      .then((customer) => {
        const query = {
          limit: getLimit(),
          starting_after: getStartingAfter(),
          ending_before: getEndingBefore(),
          'include[]': 'total_count',
        };

        if (customer) { query.customer = customer[collectionFieldName]; }

        return getSubscriptions(query)
          .spread((count, subscriptions) => P
            .map(subscriptions, (subscription) => {
              if (customer) {
                subscription.customer = customer;
              } else {
                return Implementation.Stripe.getCustomerByUserField(collectionModel, collectionFieldName, subscription.customer)
                  .then((customer) => {
                    subscription.customer = customer;
                    return subscription;
                  });
              }
              return subscription;
            })
            .then(subscriptions => [count, subscriptions]));
      }, () => new P(((resolve) => { resolve([0, []]); })));
  };
}

module.exports = SubscriptionsGetter;
