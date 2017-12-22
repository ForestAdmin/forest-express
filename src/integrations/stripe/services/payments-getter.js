
const P = require('bluebird');

function PaymentsGetter(Implementation, params, opts, integrationInfo) {
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
  }

  function getEndingBefore() {
    if (hasPagination() && params.ending_before) {
      return params.ending_before;
    }
  }

  function getCharges(query) {
    return new P(((resolve, reject) => {
      stripe.charges.list(query, (err, charges) => {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([charges.total_count, charges.data]);
      });
    }));
  }

  this.perform = function () {
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
          source: { object: 'card' },
          'include[]': 'total_count',
        };

        if (customer) { query.customer = customer[collectionFieldName]; }

        return getCharges(query)
          .spread((count, payments) => P
            .map(payments, (payment) => {
              if (customer) {
                payment.customer = customer;
              } else {
                return Implementation.Stripe.getCustomerByUserField(collectionModel, collectionFieldName, payment.customer)
                  .then((customer) => {
                    payment.customer = customer;
                    return payment;
                  });
              }
              return payment;
            })
            .then(payments => [count, payments]));
      }, () => new P(((resolve) => { resolve([0, []]); })));
  };
}

module.exports = PaymentsGetter;
