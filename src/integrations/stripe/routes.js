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

module.exports = function routes(app, model, Implementation, opts) {
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

  this.payments = function payments(request, response, next) {
    new PaymentsGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const currentPayments = results[1];

        return new PaymentsSerializer(currentPayments, modelName, { count });
      })
      .then((currentPayments) => {
        response.send(currentPayments);
      })
      .catch(next);
  };

  this.payment = function payment(request, response, next) {
    new PaymentGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(currentPayment => new PaymentsSerializer(currentPayment, modelName))
      .then((currentPayment) => {
        response.send(currentPayment);
      })
      .catch(next);
  };

  this.refund = function currentPayment(request, response, next) {
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

  this.invoices = function invoices(request, response, next) {
    new InvoicesGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const currentInvoices = results[1];

        return new InvoicesSerializer(currentInvoices, modelName, { count });
      })
      .then((currentInvoices) => {
        response.send(currentInvoices);
      })
      .catch(next);
  };

  this.invoice = function invoice(request, response, next) {
    new InvoiceGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(currentInvoice => new InvoicesSerializer(currentInvoice, modelName))
      .then((currentInvoice) => {
        response.send(currentInvoice);
      })
      .catch(next);
  };

  this.cards = function cards(request, response, next) {
    request.params.object = 'card';
    new SourcesGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const currentCards = results[1];

        return new CardsSerializer(currentCards, modelName, { count });
      })
      .then((currentCards) => {
        response.send(currentCards);
      })
      .catch(next);
  };

  this.card = function card(request, response, next) {
    new SourceGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(currentCard => new CardsSerializer(currentCard, modelName))
      .then((currentCard) => {
        response.send(currentCard);
      })
      .catch(next);
  };

  this.subscriptions = function subscriptions(request, response, next) {
    new SubscriptionsGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const currentSubscriptions = results[1];

        return new SubscriptionsSerializer(
          currentSubscriptions, modelName,
          { count },
        );
      })
      .then((currentSubscriptions) => {
        response.send(currentSubscriptions);
      })
      .catch(next);
  };

  this.subscription = function subscription(request, response, next) {
    new SubscriptionGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(currentSubscription => new SubscriptionsSerializer(currentSubscription, modelName))
      .then((currentSubscription) => {
        response.send(currentSubscription);
      })
      .catch(next);
  };

  this.bankAccounts = function bankAccounts(request, response, next) {
    request.params.object = 'bank_account';
    new SourcesGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const currentBankAccounts = results[1];

        return new BankAccountsSerializer(
          currentBankAccounts, modelName,
          { count },
        );
      })
      .then((currentBankAccounts) => {
        response.send(currentBankAccounts);
      })
      .catch(next);
  };

  this.bankAccount = function bankAccount(request, response, next) {
    new SourceGetter(
      Implementation, _.extend(request.query, request.params),
      opts, integrationInfo,
    )
      .perform()
      .then(currentBankAccount => new BankAccountsSerializer(currentBankAccount, modelName))
      .then((currentBankAccount) => {
        response.send(currentBankAccount);
      })
      .catch(next);
  };


  this.perform = function perform() {
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
