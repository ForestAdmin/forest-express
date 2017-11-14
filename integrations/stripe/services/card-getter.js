'use strict';
var P = require('bluebird');

function CardGetter(Implementation, params, opts, integrationInfo) {
  var stripe = opts.integrations.stripe.stripe(opts.integrations.stripe.apiKey);
  var collectionModel = null;

  function getCard(customer, cardId) {
    return new P(function (resolve, reject) {
      if (!customer) { return resolve([0, []]); }

      stripe.customers.retrieveCard(customer, cardId, function (err, card) {
        if (err) { return reject(err); }
        resolve(card);
      });
    });
  }

  this.perform = function () {
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Stripe.getCustomer(collectionModel,
      collectionFieldName, params.recordId)
      .then(function (customer) {
        return getCard(customer[collectionFieldName], params.cardId)
          .then(function (card) {
            return Implementation.Stripe.getCustomerByUserField(
              collectionModel, collectionFieldName, card.customer)
              .then(function (customer) {
                card.customer = customer;
                return card;
              });
          });
      });
  };
}

module.exports = CardGetter;
