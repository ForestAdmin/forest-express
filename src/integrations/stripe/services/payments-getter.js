'use strict';
var P = require('bluebird');
var logger = require('../../../services/logger');

function PaymentsGetter(Implementation, params, opts, integrationInfo) {
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

  function getCharges(query) {
    return new P(function (resolve, reject) {
      stripe.charges.list(query, function (err, charges) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([charges.total_count, charges.data]);
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
          source: { object: 'card' },
          'include[]': 'total_count'
        };

        if (customer && !!customer[collectionFieldName]) {
          query.customer = customer[collectionFieldName];
        } else {
          return P.reject();
        }

        return getCharges(query)
          .spread(function (count, payments) {
            return P
              .map(payments, function (payment) {
                if (customer) {
                  payment.customer = customer;
                } else {
                  return Implementation.Stripe.getCustomerByUserField(
                    collectionModel, collectionFieldName, payment.customer)
                    .then(function (customer) {
                      payment.customer = customer;
                      return payment;
                    });
                }
                return payment;
              })
              .then(function (payments) {
                return [count, payments];
              });
          })
          .catch(function (error) {
            logger.warn('Stripe payments retrieval issue:', error);
            return P.resolve([0, []]);
          });
      }, function () {
        return P.resolve([0, []]);
      });
  };
}

module.exports = PaymentsGetter;
