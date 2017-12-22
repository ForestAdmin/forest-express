
const P = require('bluebird');

function PaymentRefunder(params, opts) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);

  function refund(chargeId) {
    return new P(((resolve, reject) => {
      stripe.refunds.create({
        charge: chargeId,
      }, (err) => {
        if (err) { return reject(err); }
        resolve();
      });
    }));
  }

  this.perform = function () {
    return P.map(params.data.attributes.ids, id => refund(id));
  };
}

module.exports = PaymentRefunder;
