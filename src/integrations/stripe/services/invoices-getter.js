const P = require('bluebird');

function InvoicesGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  let collectionModel = null;

  function hasPagination() {
    return params.page;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
    }
    return 10;
  }

  function getStartingAfter() {
    if (hasPagination() && params.starting_after) {
      return params.starting_after;
    }
    return null;
  }

  function getEndingBefore() {
    if (hasPagination() && params.ending_before) {
      return params.ending_before;
    }
    return null;
  }

  function getInvoices(query) {
    return new P(((resolve, reject) => {
      stripe.invoices.list(query, (err, invoices) => {
        if (err) { return reject(err); }
        return resolve([invoices.total_count, invoices.data]);
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
      .then((customer) => {
        const query = {
          limit: getLimit(),
          starting_after: getStartingAfter(),
          ending_before: getEndingBefore(),
          'include[]': 'total_count',
        };

        if (customer) { query.customer = customer[collectionFieldName]; }

        return getInvoices(query)
          .spread((count, invoices) => P
            .map(invoices, (invoice) => {
              if (customer) {
                invoice.customer = customer;
              } else {
                return Implementation.Stripe
                  .getCustomerByUserField(collectionModel, collectionFieldName, invoice.customer)
                  .then((currentCustomer) => {
                    invoice.customer = currentCustomer;
                    return invoice;
                  });
              }
              return invoice;
            })
            .then(currentInvoices => [count, currentInvoices]));
      }, () => new P(((resolve) => { resolve([0, []]); })));
  };
}

module.exports = InvoicesGetter;
