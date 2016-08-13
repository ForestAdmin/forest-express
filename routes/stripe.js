'use strict';
var _ = require('lodash');
var StripePaymentsGetter = require('../services/stripe-payments-getter');
var StripePaymentsSerializer = require('../serializers/stripe-payments');
var StripePaymentRefunder = require('../services/stripe-payment-refunder');
var StripeInvoicesGetter = require('../services/stripe-invoices-getter');
var StripeInvoicesSerializer = require('../serializers/stripe-invoices');
var StripeCardsGetter = require('../services/stripe-cards-getter');
var StripeCardsSerializer = require('../serializers/stripe-cards');
var auth = require('../services/auth');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);

  this.stripePayments = function (req, res, next) {
    new StripePaymentsGetter(Implementation, _.extend(req.query, req.params),
      opts)
      .perform()
      .then(function (results) {
        var count = results[0];
        var payments = results[1];

        return new StripePaymentsSerializer(payments, modelName, {
          count: count
        });
      })
      .then(function (payments) {
        res.send(payments);
      })
      .catch(next);
  };

  this.stripeRefund = function (req, res, next) {
    new StripePaymentRefunder(req.body, opts)
      .perform()
      .then(function () {
        res.status(204).send();
      })
      .catch(function (err) {
        if (err.type === 'StripeInvalidRequestError') {
          res.status(400).send({ error: err.message });
        } else {
          next(err);
        }
      });
  };

  this.stripeInvoices = function (req, res, next) {
    new StripeInvoicesGetter(Implementation, _.extend(req.query, req.params),
      opts)
      .perform()
      .then(function (results) {
        var count = results[0];
        var invoices = results[1];

        return new StripeInvoicesSerializer(invoices, modelName, {
          count: count
        });
      })
      .then(function (invoices) {
        res.send(invoices);
      })
      .catch(next);
  };

  this.stripeCards = function (req, res, next) {
    new StripeCardsGetter(Implementation, _.extend(req.query, req.params),
      opts)
      .perform()
      .then(function (results) {
        var count = results[0];
        var cards = results[1];

        return new StripeCardsSerializer(cards, modelName, { count: count });
      })
      .then(function (cards) {
        res.send(cards);
      })
      .catch(next);
  };

  this.perform = function () {
    app.get('/forest/stripe_payments', auth.ensureAuthenticated,
      this.stripePayments);

    app.get('/forest/' + modelName + '/:recordId/stripe_payments',
      auth.ensureAuthenticated, this.stripePayments);

    app.post('/forest/stripe_payments/refunds', auth.ensureAuthenticated,
      this.stripeRefund);

    app.get('/forest/stripe_invoices', auth.ensureAuthenticated,
      this.stripeInvoices);

    app.get('/forest/' + modelName + '/:recordId/stripe_invoices',
      auth.ensureAuthenticated, this.stripeInvoices);

    app.get('/forest/' + modelName + '/:recordId/stripe_cards',
      auth.ensureAuthenticated, this.stripeCards);
  };
};
