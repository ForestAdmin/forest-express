'use strict';
var P = require('bluebird');

function StripePaymentsGetter(Implementation, params, opts, integrationInfo) {
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
          offset: getOffset(),
          source: { object: 'card' },
          'include[]': 'total_count'
        };

        if (customer) { query.customer = customer[collectionFieldName]; }

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
          });
      }, function () {
        return new P(function (resolve) { resolve([0, []]); });
      });
  };
}

module.exports = StripePaymentsGetter;
