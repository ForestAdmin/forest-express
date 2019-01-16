const P = require('bluebird');

function InvoicesGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  let collectionModel = null;

  function getInvoice(invoiceId) {
    return new P((resolve, reject) => {
      stripe.invoices.retrieve(invoiceId, (error, invoice) => {
        if (error) { return reject(error); }
        return resolve(invoice);
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

    return getInvoice(params.invoiceId)
      .then(invoice =>
        Implementation.Stripe.getCustomerByUserField(
          collectionModel,
          fieldName,
          invoice.customer,
        )
          .then((customer) => {
            invoice.customer = customer;
            return invoice;
          }));
  };
}

module.exports = InvoicesGetter;
