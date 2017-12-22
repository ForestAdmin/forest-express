const P = require('bluebird');

function InvoicesGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  let collectionModel = null;

  function getInvoice(invoiceId) {
    return new P(((resolve, reject) => {
      stripe.invoices.retrieve(invoiceId, (error, invoice) => {
        if (error) { return reject(error); }
        return resolve(invoice);
      });
    }));
  }

  this.perform = function perform() {
    const collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;
    return getInvoice(params.invoiceId)
      .then(invoice => Implementation.Stripe
        .getCustomerByUserField(collectionModel, collectionFieldName, invoice.customer)
        .then((customer) => {
          invoice.customer = customer;
          return invoice;
        }));
  };
}

module.exports = InvoicesGetter;
