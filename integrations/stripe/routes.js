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
var path = require('../../services/path');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);
  var integrationInfo;

  if (opts.integrations && opts.integrations.stripe) {
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
      app.get(path.generate('/' + modelName + '_stripe_payments', opts),
        auth.ensureAuthenticated, this.payments);

      app.get(path.generate('/' + modelName + '/:recordId/stripe_payments', opts),
        auth.ensureAuthenticated, this.payments);

      app.post(path.generate('/' + modelName + '_stripe_payments/refunds', opts),
        auth.ensureAuthenticated, this.refund);

      app.get(path.generate('/' + modelName + '_stripe_invoices', opts),
        auth.ensureAuthenticated, this.invoices);

      app.get(path.generate('/' + modelName + '/:recordId/stripe_invoices', opts),
        auth.ensureAuthenticated, this.invoices);

      app.get(path.generate('/' + modelName + '/:recordId/stripe_cards', opts),
        auth.ensureAuthenticated, this.cards);

      app.get(path.generate('/' + modelName + '_stripe_subscriptions', opts),
        auth.ensureAuthenticated, this.subscriptions);

      app.get(path.generate('/' + modelName + '/:recordId/stripe_subscriptions', opts),
        auth.ensureAuthenticated, this.subscriptions);

      app.get(path.generate('/' + modelName + '/:recordId/stripe_bank_accounts', opts),
        auth.ensureAuthenticated, this.bankAccounts);
    }
  };
};
