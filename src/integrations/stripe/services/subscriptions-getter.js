const P = require('bluebird');
const logger = require('../../../services/logger');
const dataUtil = require('../../../utils/data');

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
    return undefined;
  }

  function getEndingBefore() {
    if (hasPagination() && params.ending_before) {
      return params.ending_before;
    }
    return undefined;
  }

  function getSubscriptions(query) {
    return new P((resolve, reject) => {
      stripe.subscriptions.list(query, (err, subcriptions) => {
        if (err) { return reject(err); }
        return resolve([subcriptions.total_count, subcriptions.data]);
      });
    });
  }

  this.perform = () => {
    collectionModel = integrationInfo.collection;
    const {
      field: collectionFieldName,
      embeddedPath,
    } = integrationInfo;
    const fieldName = embeddedPath ? `${collectionFieldName}.${embeddedPath}` : collectionFieldName;

    return Implementation.Stripe.getCustomer(collectionModel, collectionFieldName, params.recordId)
      .then((customer) => {
        const query = {
          limit: getLimit(),
          starting_after: getStartingAfter(),
          ending_before: getEndingBefore(),
          'include[]': 'total_count',
        };

        if (customer && !!customer[collectionFieldName]) {
          query.customer = dataUtil.find(customer[collectionFieldName], embeddedPath);
        }

        if (customer && !query.customer) { return P.resolve([0, []]); }

        return getSubscriptions(query)
          .spread((count, subscriptions) =>
            P
              .map(subscriptions, (subscription) => {
                if (customer) {
                  subscription.customer = customer;
                } else {
                  return Implementation.Stripe.getCustomerByUserField(
                    collectionModel,
                    fieldName,
                    subscription.customer,
                  )
                    .then((customerFound) => {
                      subscription.customer = customerFound;
                      return subscription;
                    });
                }
                return subscription;
              })
              .then(subscriptionsData => [count, subscriptionsData]))
          .catch((error) => {
            logger.warn('Stripe subscriptions retrieval issue:', error);
            return P.resolve([0, []]);
          });
      }, () => P.resolve([0, []]));
  };
}

module.exports = SubscriptionsGetter;
