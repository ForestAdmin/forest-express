'use strict';
var P = require('bluebird');

function InvoicesGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

  function getInvoice(invoiceId) {
    return new P(function (resolve, reject) {
      stripe.invoices.retrieve(invoiceId, function (error, invoice) {
        if (error) { return reject(error); }
        resolve(invoice);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;
    return getInvoice(params.invoiceId)
      .then(function (invoice) {
        return Implementation.Stripe.getCustomerByUserField(
          collectionModel, collectionFieldName, invoice.customer)
          .then(function (customer) {
            invoice.customer = customer;
            return invoice;
          });
      });
  };
}

module.exports = InvoicesGetter;
