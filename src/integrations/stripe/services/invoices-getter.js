'use strict';
var P = require('bluebird');

function InvoicesGetter(Implementation, params, opts, integrationInfo) {
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

  function getInvoices(query) {
    return new P(function (resolve, reject) {
      stripe.invoices.list(query, function (err, invoices) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([invoices.total_count, invoices.data]);
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

        if (customer) { query.customer = customer[collectionFieldName]; }

        return getInvoices(query)
          .spread(function (count, invoices) {
            return P
              .map(invoices, function (invoice) {
                if (customer) {
                  invoice.customer = customer;
                } else {
                  return Implementation.Stripe.getCustomerByUserField(
                    collectionModel, collectionFieldName, invoice.customer)
                    .then(function (customer) {
                      invoice.customer = customer;
                      return invoice;
                    });
                }
                return invoice;
              })
              .then(function (invoices) {
                return [count, invoices];
              });
          });
      }, function () {
        return new P(function (resolve) { resolve([0, []]); });
      });
  };
}

module.exports = InvoicesGetter;

