'use strict';
var P = require('bluebird');

function BankAccountsGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;
  // jshint camelcase: false  

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

  function getBankAccounts(customerId, query) {
    return new P(function (resolve, reject) {
      stripe.customers.listSources(customerId, query, function (err, bankAccounts) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([bankAccounts.total_count, bankAccounts.data]);
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
          'include[]': 'total_count',
          object: params.object
        };

        return getBankAccounts(customer[collectionFieldName], query)
          .spread(function (count, bankAccounts) {
            return P
              .map(bankAccounts, function (bankAccount) {
                if (customer) {
                  bankAccount.customer = customer;
                } else {
                  return Implementation.Stripe.getCustomerByUserField(
                    collectionModel, collectionFieldName, bankAccount.customer)
                    .then(function (customer) {
                      bankAccount.customer = customer;
                      return bankAccount;
                    });
                }
                return bankAccount;
              })
              .then(function (bankAccounts) {
                return [count, bankAccounts];
              });
          });
      }, function () {
        return new P(function (resolve) { resolve([0, []]); });
      });
  };
}

module.exports = BankAccountsGetter;
