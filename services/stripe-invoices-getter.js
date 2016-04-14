'use strict';
var P = require('bluebird');

function StripeInvoicesFinder(Implementation, params, opts) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var customerModel = null;

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
    var userCollectionName = opts.integrations.stripe.userCollection;
    var userField = opts.integrations.stripe.userField;
    customerModel = Implementation.getModels()[userCollectionName];

    return Implementation.Stripe.getCustomer(customerModel, params.recordId,
      userField)
      .then(function (customer) {
        var query = {
          limit: getLimit(),
          offset: getOffset(),
          'include[]': 'total_count'
        };

        if (customer) { query.customer = customer[userField]; }

        return getInvoices(query)
          .spread(function (count, invoices) {
              return P
                .map(invoices, function (invoice) {
                  if (customer) {
                    invoice.customer = customer;
                  } else {
                    return Implementation.Stripe.getCustomerByUserField(
                      customerModel, invoice.customer)
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

module.exports = StripeInvoicesFinder;

