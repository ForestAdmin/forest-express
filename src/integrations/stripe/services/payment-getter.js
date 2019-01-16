const P = require('bluebird');

function PaymentsGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  let collectionModel = null;

  function getCharge(paymentId) {
    return new P((resolve, reject) => {
      stripe.charges.retrieve(paymentId, (error, charge) => {
        if (error) { return reject(error); }
        return resolve(charge);
      });
    });
  }

  this.perform = () => {
    collectionModel = integrationInfo.collection;
    const {
      field: collectionFieldName,
      embeddedPath,
    } = integrationInfo;
    const fieldName = embeddedPath ? `${collectionFieldName}.${embeddedPath}` : collectionFieldName;

    return getCharge(params.paymentId)
      .then(payment =>
        Implementation.Stripe.getCustomerByUserField(
          collectionModel,
          fieldName,
          payment.customer,
        )
          .then((customer) => {
            payment.customer = customer;
            return payment;
          }));
  };
}

module.exports = PaymentsGetter;
