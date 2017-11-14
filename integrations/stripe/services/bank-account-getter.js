'use strict';
var P = require('bluebird');

function BankAccountsGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

  function getBankAccount(customerId, query) {
    return new P(function (resolve, reject) {
      stripe.customers.retrieveSource(customerId, query, function (err, bankAccount) {
        if (err) { return reject(err); }
        resolve(bankAccount);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Stripe.getCustomer(collectionModel,
      collectionFieldName, params.recordId)
      .then(function (customer) {
        return getBankAccount(customer[collectionFieldName], params.objectId)
          .then(function (bankAccount) {
            return Implementation.Stripe.getCustomerByUserField(
              collectionModel, collectionFieldName, bankAccount.customer)
              .then(function (customer) {
                bankAccount.customer = customer;
                return bankAccount;
              });
          });
      });
  };
}

module.exports = BankAccountsGetter;
