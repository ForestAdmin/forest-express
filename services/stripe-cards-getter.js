'use strict';
var P = require('bluebird');

function StripeCardsGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
    } else {
      return 10;
    }
  }

  function getOffset() {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * getLimit();
    } else {
      return 0;
    }
  }

  function getCards(customer, query) {
    return new P(function (resolve, reject) {
      if (!customer) { return resolve([0, []]); }

      stripe.customers.listCards(customer, query, function (err, cards) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([cards.total_count, cards.data]);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Stripe.getCustomer(collectionModel,
      collectionFieldName, params.recordId)
      .then(function (customer) {
        var query = {
          limit: getLimit(),
          offset: getOffset(),
          'include[]': 'total_count'
        };

        return getCards(customer[collectionFieldName], query)
          .spread(function (count, cards) {
            return P
              .map(cards, function (card) {
                return Implementation.Stripe.getCustomerByUserField(
                  collectionModel, collectionFieldName, card.customer)
                  .then(function (customer) {
                    card.customer = customer;
                    return card;
                  });
              })
              .then(function (cards) {
                return [count, cards];
              });
          });
      });
  };
}

module.exports = StripeCardsGetter;
