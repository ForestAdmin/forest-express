'use strict';
var _ = require('lodash');
var IntegrationInformationsGetter = require('../../services/integration-informations-getter');
var PaymentsGetter = require('./services/payments-getter');
var InvoicesGetter = require('./services/invoices-getter');
var CardsGetter = require('./services/cards-getter');
var BankAccountsGetter = require('./services/bank-accounts-getter');
var SubscriptionsGetter = require('./services/subscriptions-getter');
var PaymentRefunder = require('./services/payment-refunder');
var PaymentsSerializer = require('./serializers/payments');
var InvoicesSerializer = require('./serializers/invoices');
var CardsSerializer = require('./serializers/cards');
var SubscriptionsSerializer = require('./serializers/subscriptions');
var BankAccountsSerializer = require('./serializers/bank-accounts');
var auth = require('../../services/auth');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);
  var integrationInfo;

  if (opts.integrations) {
    integrationInfo = new IntegrationInformationsGetter(modelName,
         Implementation, opts.integrations.stripe).perform();
  }

  if (integrationInfo) {
    var integrationValues = integrationInfo.split('.');
    integrationInfo = {
      collection: Implementation.getModels()[integrationValues[0]],
      field: integrationValues[1]
    };
  }

  this.payments = function (req, res, next) {
    new PaymentsGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var payments = results[1];

        return new PaymentsSerializer(payments, modelName, { count: count });
      })
      .then(function (payments) {
        res.send(payments);
      })
      .catch(next);
  };

  this.refund = function (req, res, next) {
    new PaymentRefunder(req.body, opts)
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

  this.invoices = function (req, res, next) {
    new InvoicesGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var invoices = results[1];

        return new InvoicesSerializer(invoices, modelName, { count: count });
      })
      .then(function (invoices) {
        res.send(invoices);
      })
      .catch(next);
  };

  this.cards = function (req, res, next) {
    new CardsGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var cards = results[1];

        return new CardsSerializer(cards, modelName, { count: count });
      })
      .then(function (cards) {
        res.send(cards);
      })
      .catch(next);
  };

  this.subscriptions = function (req, res, next) {
    new SubscriptionsGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var cards = results[1];

        return new SubscriptionsSerializer(cards, modelName, { count: count });
      })
      .then(function (cards) {
        res.send(cards);
      })
      .catch(next);
  };

  this.bankAccounts = function (req, res, next) {
    new BankAccountsGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var cards = results[1];

        return new BankAccountsSerializer(cards, modelName, { count: count });
      })
      .then(function (cards) {
        res.send(cards);
      })
      .catch(next);
  };

  this.perform = function () {
    if (integrationInfo) {
      app.get('/forest/' + modelName + '_stripe_payments',
        auth.ensureAuthenticated, this.payments);

      app.get('/forest/' + modelName + '/:recordId/stripe_payments',
        auth.ensureAuthenticated, this.payments);

      app.post('/forest/' + modelName + '_stripe_payments/refunds',
        auth.ensureAuthenticated, this.refund);

      app.get('/forest/' + modelName + '_stripe_invoices',
        auth.ensureAuthenticated, this.invoices);

      app.get('/forest/' + modelName + '/:recordId/stripe_invoices',
        auth.ensureAuthenticated, this.invoices);

      app.get('/forest/' + modelName + '/:recordId/stripe_cards',
        auth.ensureAuthenticated, this.cards);

      app.get('/forest/' + modelName + '_stripe_subscriptions',
        auth.ensureAuthenticated, this.subscriptions);

      app.get('/forest/' + modelName + '/:recordId/stripe_subscriptions',
        auth.ensureAuthenticated, this.subscriptions);

      app.get('/forest/' + modelName + '/:recordId/stripe_bank_accounts',
        auth.ensureAuthenticated, this.bankAccounts);
    }
  };
};
