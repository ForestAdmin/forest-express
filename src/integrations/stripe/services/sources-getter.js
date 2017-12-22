
const P = require('bluebird');

function SourcesGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  // jshint camelcase: false

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

  function getSources(customerId, query) {
    return new P(((resolve, reject) => {
      stripe.customers.listSources(customerId, query, (error, sources) => {
        if (error) { return reject(error); }
        // jshint camelcase: false
        resolve([sources.total_count, sources.data]);
      });
    }));
  }

  this.perform = function () {
    const collectionFieldName = integrationInfo.field;
    const collectionModel = integrationInfo.collection;

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
          object: params.object,
        };

        return getSources(customer[collectionFieldName], query)
          .spread((count, sources) => P
            .map(sources, (source) => {
              if (customer) {
                source.customer = customer;
              } else {
                return Implementation.Stripe.getCustomerByUserField(collectionModel, collectionFieldName, source.customer)
                  .then((customer) => {
                    source.customer = customer;
                    return source;
                  });
              }
              return source;
            })
            .then(sources => [count, sources]));
      }, () => new P(((resolve) => { resolve([0, []]); })));
  };
}

module.exports = SourcesGetter;
