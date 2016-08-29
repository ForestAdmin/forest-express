'use strict';
var P = require('bluebird');

function CardsGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

  function hasPagination() {
    return params.page;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
    } else {
      return 10;
    }
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
          starting_after: getStartingAfter(),
          ending_before: getEndingBefore(),
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

module.exports = CardsGetter;
