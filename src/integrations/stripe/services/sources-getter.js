const P = require('bluebird');

function SourcesGetter(Implementation, params, opts, integrationInfo) {
  const stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);

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

  function getSources(customerId, query) {
    return new P(((resolve, reject) => {
      stripe.customers.listSources(customerId, query, (error, sources) => {
        if (error) { return reject(error); }
        return resolve([sources.total_count, sources.data]);
      });
    }));
  }

  this.perform = function perform() {
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
                return Implementation.Stripe
                  .getCustomerByUserField(collectionModel, collectionFieldName, source.customer)
                  .then((currentCustomer) => {
                    source.customer = currentCustomer;
                    return source;
                  });
              }
              return source;
            })
            .then(currentSources => [count, currentSources]));
      }, () => new P(((resolve) => { resolve([0, []]); })));
  };
}

module.exports = SourcesGetter;
