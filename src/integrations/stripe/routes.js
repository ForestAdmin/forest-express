
const _ = require('lodash');
const IntegrationInformationsGetter = require('../../services/integration-informations-getter');
const PaymentsGetter = require('./services/payments-getter');
const PaymentGetter = require('./services/payment-getter');
const InvoicesGetter = require('./services/invoices-getter');
const InvoiceGetter = require('./services/invoice-getter');
const SourcesGetter = require('./services/sources-getter');
const SourceGetter = require('./services/source-getter');
const SubscriptionsGetter = require('./services/subscriptions-getter');
const SubscriptionGetter = require('./services/subscription-getter');
const PaymentRefunder = require('./services/payment-refunder');
const PaymentsSerializer = require('./serializers/payments');
const InvoicesSerializer = require('./serializers/invoices');
const CardsSerializer = require('./serializers/cards');
const SubscriptionsSerializer = require('./serializers/subscriptions');
const BankAccountsSerializer = require('./serializers/bank-accounts');
const auth = require('../../services/auth');
const path = require('../../services/path');

module.exports = function (app, model, Implementation, opts) {
  const modelName = Implementation.getModelName(model);
  let integrationInfo;

  if (opts.integrations && opts.integrations.stripe) {
    integrationInfo = new IntegrationInformationsGetter(
      modelName,
      Implementation, opts.integrations.stripe,
    ).perform();
  }

  if (integrationInfo) {
    const integrationValues = integrationInfo.split('.');
    integrationInfo = {
      collection: Implementation.getModels()[integrationValues[0]],
      field: integrationValues[1],
    };
  }

  this.payments = function (request, response, next) {
    new PaymentsGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const payments = results[1];

        return new PaymentsSerializer(payments, modelName, { count });
      })
      .then((payments) => {
        response.send(payments);
      })
      .catch(next);
  };

  this.payment = function (request, response, next) {
    new PaymentGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(payment => new PaymentsSerializer(payment, modelName))
      .then((payment) => {
        response.send(payment);
      })
      .catch(next);
  };

  this.refund = function (request, response, next) {
    new PaymentRefunder(request.body, opts)
      .perform()
      .then(() => {
        response.status(204).send();
      })
      .catch((err) => {
        if (err.type === 'StripeInvalidRequestError') {
          response.status(400).send({ error: err.message });
        } else {
          next(err);
        }
      });
  };

  this.invoices = function (request, response, next) {
    new InvoicesGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const invoices = results[1];

        return new InvoicesSerializer(invoices, modelName, { count });
      })
      .then((invoices) => {
        response.send(invoices);
      })
      .catch(next);
  };

  this.invoice = function (request, response, next) {
    new InvoiceGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(invoice => new InvoicesSerializer(invoice, modelName))
      .then((invoice) => {
        response.send(invoice);
      })
      .catch(next);
  };

  this.cards = function (request, response, next) {
    request.params.object = 'card';
    new SourcesGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const cards = results[1];

        return new CardsSerializer(cards, modelName, { count });
      })
      .then((cards) => {
        response.send(cards);
      })
      .catch(next);
  };

  this.card = function (request, response, next) {
    new SourceGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(card => new CardsSerializer(card, modelName))
      .then((card) => {
        response.send(card);
      })
      .catch(next);
  };

  this.subscriptions = function (request, response, next) {
    new SubscriptionsGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const subscriptions = results[1];

        return new SubscriptionsSerializer(
          subscriptions, modelName,
          { count },
        );
      })
      .then((subscriptions) => {
        response.send(subscriptions);
      })
      .catch(next);
  };

  this.subscription = function (request, response, next) {
    new SubscriptionGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(subscription => new SubscriptionsSerializer(subscription, modelName))
      .then((subscription) => {
        response.send(subscription);
      })
      .catch(next);
  };

  this.bankAccounts = function (request, response, next) {
    request.params.object = 'bank_account';
    new SourcesGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const bankAccounts = results[1];

        return new BankAccountsSerializer(
          bankAccounts, modelName,
          { count },
        );
      })
      .then((bankAccounts) => {
        response.send(bankAccounts);
      })
      .catch(next);
  };

  this.bankAccount = function (request, response, next) {
    new SourceGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(bankAccount => new BankAccountsSerializer(bankAccount, modelName))
      .then((bankAccount) => {
        response.send(bankAccount);
      })
      .catch(next);
  };


  this.perform = function () {
    if (integrationInfo) {
      app.get(
        path.generate(`${modelName}_stripe_payments`, opts),
        auth.ensureAuthenticated, this.payments,
      );

      app.get(
        path.generate(`${modelName}_stripe_payments/:paymentId`, opts),
        auth.ensureAuthenticated, this.payment,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_payments`, opts),
        auth.ensureAuthenticated, this.payments,
      );

      app.post(
        path.generate(`${modelName}_stripe_payments/refunds`, opts),
        auth.ensureAuthenticated, this.refund,
      );

      app.get(
        path.generate(`${modelName}_stripe_invoices`, opts),
        auth.ensureAuthenticated, this.invoices,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_invoices`, opts),
        auth.ensureAuthenticated, this.invoices,
      );

      app.get(
        path.generate(`${modelName}_stripe_invoices/:invoiceId`, opts),
        auth.ensureAuthenticated, this.invoice,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_cards`, opts),
        auth.ensureAuthenticated, this.cards,
      );

      app.get(
        path.generate(`${modelName}_stripe_cards`, opts),
        auth.ensureAuthenticated, this.card,
      );

      app.get(
        path.generate(`${modelName}_stripe_subscriptions`, opts),
        auth.ensureAuthenticated, this.subscriptions,
      );

      app.get(
        path.generate(`${modelName}_stripe_subscriptions/:subscriptionId`, opts),
        auth.ensureAuthenticated, this.subscription,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_subscriptions`, opts),
        auth.ensureAuthenticated, this.subscriptions,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_bank_accounts`, opts),
        auth.ensureAuthenticated, this.bankAccounts,
      );

      app.get(
        path.generate(`${modelName}_stripe_bank_accounts`, opts),
        auth.ensureAuthenticated, this.bankAccount,
      );
    }
  };
};
