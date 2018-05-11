'use strict';
var P = require('bluebird');
var logger = require('../../../services/logger');

function SourcesGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  // jshint camelcase: false

  function hasPagination() {
    return params.page;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
    } else {
      return 10;
    }
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
    return new P(function (resolve, reject) {
      stripe.customers.listSources(customerId, query, function (error, sources) {
        if (error) { return reject(error); }
        // jshint camelcase: false
        resolve([sources.total_count, sources.data]);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    var collectionModel = integrationInfo.collection;

    return Implementation.Stripe.getCustomer(collectionModel,
      collectionFieldName, params.recordId)
      .then(function (customer) {
        var query = {
          limit: getLimit(),
          starting_after: getStartingAfter(),
          ending_before: getEndingBefore(),
          'include[]': 'total_count',
          object: params.object
        };

        if (!customer[collectionFieldName]) {
          return P.reject();
        }

        return getSources(customer[collectionFieldName], query)
          .spread(function (count, sources) {
            return P
              .map(sources, function (source) {
                if (customer) {
                  source.customer = customer;
                } else {
                  return Implementation.Stripe.getCustomerByUserField(
                    collectionModel, collectionFieldName, source.customer)
                    .then(function (customer) {
                      source.customer = customer;
                      return source;
                    });
                }
                return source;
              })
              .then(function (sources) {
                return [count, sources];
              });
          })
          .catch(function (error) {
            logger.warn('Stripe sources retrieval issue:', error);
            return P.resolve([0, []]);
          });
      }, function () {
        return P.resolve([0, []]);
      });
  };
}

module.exports = SourcesGetter;
