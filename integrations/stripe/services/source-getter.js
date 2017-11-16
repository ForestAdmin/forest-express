'use strict';
var P = require('bluebird');

function SourceGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

  function getSource(customerId, objectId) {
    return new P(function (resolve, reject) {
      stripe.customers.retrieveSource(customerId, objectId, function (error, source) {
        if (error) { return reject(error); }
        resolve(source);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Stripe.getCustomer(collectionModel,
      collectionFieldName, params.recordId)
      .then(function (customer) {
        return getSource(customer[collectionFieldName], params.objectId)
          .then(function (source) {
            return Implementation.Stripe.getCustomerByUserField(
              collectionModel, collectionFieldName, source.customer)
              .then(function (customer) {
                source.customer = customer;
                return source;
              });
          });
      });
  };
}

module.exports = SourceGetter;
