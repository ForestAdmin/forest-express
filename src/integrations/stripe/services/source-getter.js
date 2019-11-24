const P = require('bluebird');

function SourceGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  let collectionModel = null;

  function getSource(customerId, objectId) {
    return new P((resolve, reject) => {
      stripe.customers.retrieveSource(customerId, objectId, (error, source) => {
        if (error) { return reject(error); }
        return resolve(source);
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

    return Implementation.Stripe.getCustomer(
      collectionModel,
      collectionFieldName,
      params.recordId,
    )
      .then((customer) =>
        getSource(customer[collectionFieldName], params.objectId)
          .then((source) =>
            Implementation.Stripe.getCustomerByUserField(
              collectionModel,
              fieldName,
              source.customer,
            )
              .then((customerFound) => {
                source.customer = customerFound;
                return source;
              })));
  };
}

module.exports = SourceGetter;
