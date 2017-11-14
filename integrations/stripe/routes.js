'use strict';
var _ = require('lodash');
var IntegrationInformationsGetter = require('../../services/integration-informations-getter');
var PaymentsGetter = require('./services/payments-getter');
var PaymentGetter = require('./services/payment-getter');
var InvoicesGetter = require('./services/invoices-getter');
var InvoiceGetter = require('./services/invoice-getter');
var CardsGetter = require('./services/cards-getter');
var CardGetter = require('./services/card-getter');
var BankAccountsGetter = require('./services/bank-accounts-getter');
var BankAccountGetter = require('./services/bank-account-getter');
var SubscriptionsGetter = require('./services/subscriptions-getter');
var SubscriptionGetter = require('./services/subscription-getter');
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

  this.payment = function (req, res, next) {
    new PaymentGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (payment) {
        return new PaymentsSerializer(payment, modelName);
      })
      .then(function (payment) {
        res.send(payment);
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

  this.invoice = function (req, res, next) {
    new InvoiceGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (invoice) {
        return new InvoicesSerializer(invoice, modelName);
      })
      .then(function (invoice) {
        res.send(invoice);
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

  this.card = function (req, res, next) {
    new CardGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (card) {
        return new CardsSerializer(card, modelName);
      })
      .then(function (card) {
        res.send(card);
      })
      .catch(next);
  };

  this.subscriptions = function (req, res, next) {
    new SubscriptionsGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var subscriptions = results[1];

        return new SubscriptionsSerializer(subscriptions, modelName,
          { count: count });
      })
      .then(function (subscriptions) {
        res.send(subscriptions);
      })
      .catch(next);
  };

  this.subscription = function (req, res, next) {
    new SubscriptionGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (subscription) {
        return new SubscriptionsSerializer(subscription, modelName);
      })
      .then(function (subscription) {
        res.send(subscription);
      })
      .catch(next);
  };

  this.bankAccounts = function (req, res, next) {
    new BankAccountsGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var bankAccounts = results[1];

        return new BankAccountsSerializer(bankAccounts, modelName,
          { count: count });
      })
      .then(function (bankAccounts) {
        res.send(bankAccounts);
      })
      .catch(next);
  };

  this.bankAccount = function (req, res, next) {
    new BankAccountGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (bankAccount) {
        return new BankAccountsSerializer(bankAccount, modelName);
      })
      .then(function (bankAccount) {
        res.send(bankAccount);
      })
      .catch(next);
  };


  this.perform = function () {
    if (integrationInfo) {
      app.get(path.generate(modelName + '_stripe_payments', opts),
        auth.ensureAuthenticated, this.payments);

      app.get(path.generate(modelName + '_stripe_payments/:paymentId', opts),
        auth.ensureAuthenticated, this.payment);

      app.get(path.generate(modelName + '/:recordId/stripe_payments', opts),
        auth.ensureAuthenticated, this.payments);

      app.post(path.generate(modelName + '_stripe_payments/refunds', opts),
        auth.ensureAuthenticated, this.refund);

      app.get(path.generate(modelName + '_stripe_invoices', opts),
        auth.ensureAuthenticated, this.invoices);

      app.get(path.generate(modelName + '/:recordId/stripe_invoices', opts),
        auth.ensureAuthenticated, this.invoices);

      app.get(path.generate(modelName + '_stripe_invoices/:invoiceId', opts),
        auth.ensureAuthenticated, this.invoice);

      app.get(path.generate(modelName + '/:recordId/stripe_cards', opts),
        auth.ensureAuthenticated, this.cards);

      app.get(path.generate(modelName + '_stripe_cards', opts),
        auth.ensureAuthenticated, this.card);

      app.get(path.generate(modelName + '_stripe_subscriptions', opts),
        auth.ensureAuthenticated, this.subscriptions);

      app.get(path.generate(modelName + '_stripe_subscriptions/:subscriptionId', opts),
        auth.ensureAuthenticated, this.subscription);

      app.get(path.generate(modelName + '/:recordId/stripe_subscriptions', opts),
        auth.ensureAuthenticated, this.subscriptions);

      app.get(path.generate(modelName + '/:recordId/stripe_bank_accounts', opts),
        auth.ensureAuthenticated, this.bankAccounts);

      app.get(path.generate(modelName + '_stripe_bank_accounts', opts),
        auth.ensureAuthenticated, this.bankAccount);
    }
  };
};
