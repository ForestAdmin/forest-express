const P = require('bluebird');
const logger = require('../../../services/logger');
const dataUtil = require('../../../utils/data');

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
    return undefined;
  }

  function getEndingBefore() {
    if (hasPagination() && params.ending_before) {
      return params.ending_before;
    }
    return undefined;
  }

  function getSources(customerId, query) {
    return new P((resolve, reject) => {
      stripe.customers.listSources(customerId, query, (error, sources) => {
        if (error) { return reject(error); }
        return resolve([sources.total_count, sources.data]);
      });
    });
  }

  this.perform = () => {
    const {
      collection: collectionModel,
      field: collectionFieldName,
      embeddedPath,
    } = integrationInfo;
    const fieldName = embeddedPath ? `${collectionFieldName}.${embeddedPath}` : collectionFieldName;

    return Implementation.Stripe.getCustomer(collectionModel, collectionFieldName, params.recordId)
      .then((customer) => {
        const query = {
          limit: getLimit(),
          starting_after: getStartingAfter(),
          ending_before: getEndingBefore(),
          'include[]': 'total_count',
          object: params.object,
        };

        let customerId;
        if (customer[collectionFieldName]) {
          customerId = dataUtil.find(customer[collectionFieldName], embeddedPath);
        }

        if (customer && !customerId) { return P.resolve([0, []]); }

        return getSources(customerId, query)
          .spread((count, sources) =>
            P
              .map(sources, (source) => {
                if (customer) {
                  source.customer = customer;
                } else {
                  return Implementation.Stripe.getCustomerByUserField(
                    collectionModel,
                    fieldName,
                    source.customer,
                  )
                    .then((customerFound) => {
                      source.customer = customerFound;
                      return source;
                    });
                }
                return source;
              })
              .then((sourcesData) => [count, sourcesData]))
          .catch((error) => {
            logger.warn('Stripe sources retrieval issue:', error);
            return P.resolve([0, []]);
          });
      }, () => P.resolve([0, []]));
  };
}

module.exports = SourcesGetter;
