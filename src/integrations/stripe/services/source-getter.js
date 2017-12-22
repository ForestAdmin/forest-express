const P = require('bluebird');

function SourceGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  let collectionModel = null;

  function getSource(customerId, objectId) {
    return new P(((resolve, reject) => {
      stripe.customers.retrieveSource(customerId, objectId, (error, source) => {
        if (error) { return reject(error); }
        return resolve(source);
      });
    }));
  }

  this.perform = function perform() {
    const collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Stripe.getCustomer(
      collectionModel,
      collectionFieldName, params.recordId,
    )
      .then(customer => getSource(customer[collectionFieldName], params.objectId)
        .then(source => Implementation.Stripe
          .getCustomerByUserField(collectionModel, collectionFieldName, source.customer)
          .then((currentCustomer) => {
            source.customer = currentCustomer;
            return source;
          })));
  };
}

module.exports = SourceGetter;
