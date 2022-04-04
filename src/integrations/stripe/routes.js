const { inject } = require('@forestadmin/context');
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
const serializePayments = require('./serializers/payments');
const serializeInvoices = require('./serializers/invoices');
const serializeCards = require('./serializers/cards');
const serializeSubscriptions = require('./serializers/subscriptions');
const serializeBankAccounts = require('./serializers/bank-accounts');
const auth = require('../../services/auth');
const path = require('../../services/path');

module.exports = function Routes(app, model, Implementation, opts) {
  const { modelsManager } = inject();
  const modelName = Implementation.getModelName(model);
  let integrationInfo;

  if (opts.integrations && opts.integrations.stripe) {
    integrationInfo = new IntegrationInformationsGetter(
      modelName,
      Implementation,
      opts.integrations.stripe,
    ).perform();
  }

  if (integrationInfo) {
    const SEPARATOR = '.';
    const integrationValues = integrationInfo.split(SEPARATOR);
    integrationInfo = {
      collection: modelsManager.getModels()[integrationValues[0]],
      field: integrationValues[1],
      embeddedPath: integrationValues.slice(2).join(SEPARATOR) || null,
    };
  }

  const getPayments = (request, response, next) => {
    new PaymentsGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const payments = results[1];

        return serializePayments(payments, modelName, { count });
      })
      .then((payments) => { response.send(payments); })
      .catch(next);
  };

  const getPayment = (request, response, next) => {
    new PaymentGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((payment) => serializePayments(payment, modelName))
      .then((payment) => { response.send(payment); })
      .catch(next);
  };

  const refund = (request, response, next) => {
    new PaymentRefunder(request.body, opts)
      .perform()
      .then(() => { response.status(204).send(); })
      .catch((err) => {
        if (err.type === 'StripeInvalidRequestError') {
          response.status(400).send({ error: err.message });
        } else {
          next(err);
        }
      });
  };

  const getInvoices = (request, response, next) => {
    new InvoicesGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const invoices = results[1];

        return serializeInvoices(invoices, modelName, { count });
      })
      .then((invoices) => { response.send(invoices); })
      .catch(next);
  };

  const getInvoice = (request, response, next) => {
    new InvoiceGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((invoice) => serializeInvoices(invoice, modelName))
      .then((invoice) => { response.send(invoice); })
      .catch(next);
  };

  const getCards = (request, response, next) => {
    request.params.object = 'card';
    new SourcesGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const cards = results[1];

        return serializeCards(cards, modelName, { count });
      })
      .then((cards) => { response.send(cards); })
      .catch(next);
  };

  const getCard = (request, response, next) => {
    new SourceGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((card) => serializeCards(card, modelName))
      .then((card) => { response.send(card); })
      .catch(next);
  };

  const getSubscriptions = (request, response, next) => {
    new SubscriptionsGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const subscriptions = results[1];

        return serializeSubscriptions(subscriptions, modelName, { count });
      })
      .then((subscriptions) => { response.send(subscriptions); })
      .catch(next);
  };

  const getSubscription = (request, response, next) => {
    new SubscriptionGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((subscription) => serializeSubscriptions(subscription, modelName))
      .then((subscription) => { response.send(subscription); })
      .catch(next);
  };

  const getBankAccounts = (request, response, next) => {
    request.params.object = 'bank_account';
    new SourcesGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const bankAccounts = results[1];

        return serializeBankAccounts(bankAccounts, modelName, { count });
      })
      .then((bankAccounts) => { response.send(bankAccounts); })
      .catch(next);
  };

  const getBankAccount = (request, response, next) => {
    new SourceGetter(Implementation, _.extend(request.query, request.params), opts, integrationInfo)
      .perform()
      .then((bankAccount) => serializeBankAccounts(bankAccount, modelName))
      .then((bankAccount) => { response.send(bankAccount); })
      .catch(next);
  };

  this.perform = () => {
    if (integrationInfo) {
      app.get(
        path.generate(`${modelName}_stripe_payments`, opts),
        auth.ensureAuthenticated,
        getPayments,
      );

      app.get(
        path.generate(`${modelName}_stripe_payments/:paymentId`, opts),
        auth.ensureAuthenticated,
        getPayment,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_payments`, opts),
        auth.ensureAuthenticated,
        getPayments,
      );

      app.post(
        path.generate(`${modelName}_stripe_payments/refunds`, opts),
        auth.ensureAuthenticated,
        refund,
      );

      app.get(
        path.generate(`${modelName}_stripe_invoices`, opts),
        auth.ensureAuthenticated,
        getInvoices,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_invoices`, opts),
        auth.ensureAuthenticated,
        getInvoices,
      );

      app.get(
        path.generate(`${modelName}_stripe_invoices/:invoiceId`, opts),
        auth.ensureAuthenticated,
        getInvoice,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_cards`, opts),
        auth.ensureAuthenticated,
        getCards,
      );

      app.get(
        path.generate(`${modelName}_stripe_cards`, opts),
        auth.ensureAuthenticated,
        getCard,
      );

      app.get(
        path.generate(`${modelName}_stripe_subscriptions`, opts),
        auth.ensureAuthenticated,
        getSubscriptions,
      );

      app.get(
        path.generate(`${modelName}_stripe_subscriptions/:subscriptionId`, opts),
        auth.ensureAuthenticated,
        getSubscription,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_subscriptions`, opts),
        auth.ensureAuthenticated,
        getSubscriptions,
      );

      app.get(
        path.generate(`${modelName}/:recordId/stripe_bank_accounts`, opts),
        auth.ensureAuthenticated,
        getBankAccounts,
      );

      app.get(
        path.generate(`${modelName}_stripe_bank_accounts`, opts),
        auth.ensureAuthenticated,
        getBankAccount,
      );
    }
  };
};
