'use strict';
var P = require('bluebird');

function PaymentsGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

  function getCharge(paymentId) {
    return new P(function (resolve, reject) {
      stripe.charges.retrieve(paymentId, function (error, charge) {
        if (error) { return reject(error); }
        resolve(charge);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return getCharge(params.paymentId)
      .then(function (payment) {
        return Implementation.Stripe.getCustomerByUserField(
          collectionModel, collectionFieldName, payment.customer)
          .then(function (customer) {
            payment.customer = customer;
            return payment;
          });
      });
  };
}

module.exports = PaymentsGetter;
