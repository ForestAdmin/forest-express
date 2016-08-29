'use strict';
var P = require('bluebird');

function PaymentRefunder(params, opts) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);

  function refund(chargeId) {
    return new P(function (resolve, reject) {
      stripe.refunds.create({
        charge: chargeId
      }, function (err) {
        if (err) { return reject(err); }
        resolve();
      });
    });
  }

  this.perform = function () {
    return P.map(params.data.attributes.ids, function (id) {
      return refund(id);
    });
  };
}

module.exports = PaymentRefunder;
