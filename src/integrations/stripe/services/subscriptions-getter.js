'use strict';
var P = require('bluebird');
var logger = require('../../../services/logger');

function SubscriptionsGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

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

  function getSubscriptions(query) {
    return new P(function (resolve, reject) {
      stripe.subscriptions.list(query, function (err, subcriptions) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([subcriptions.total_count, subcriptions.data]);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Stripe.getCustomer(collectionModel,
      collectionFieldName, params.recordId)
      .then(function (customer) {
        var query = {
          limit: getLimit(),
          starting_after: getStartingAfter(),
          ending_before: getEndingBefore(),
          'include[]': 'total_count'
        };

        if (customer && !!customer[collectionFieldName]) {
          query.customer = customer[collectionFieldName];
        } else {
          return P.reject();
        }

        return getSubscriptions(query)
          .spread(function (count, subscriptions) {
            return P
              .map(subscriptions, function (subscription) {
                if (customer) {
                  subscription.customer = customer;
                } else {
                  return Implementation.Stripe.getCustomerByUserField(
                    collectionModel, collectionFieldName, subscription.customer)
                    .then(function (customer) {
                      subscription.customer = customer;
                      return subscription;
                    });
                }
                return subscription;
              })
              .then(function (subscriptions) {
                return [count, subscriptions];
              });
          })
          .catch(function (error) {
            logger.warn('Stripe subscriptions retrieval issue:', error);
            return P.resolve([0, []]);
          });
      }, function () {
        return P.resolve([0, []]);
      });
  };
}

module.exports = SubscriptionsGetter;
