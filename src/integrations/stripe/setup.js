
const _ = require('lodash');

const INTEGRATION_NAME = 'stripe';

exports.createCollections = function (Implementation, apimap, collectionAndFieldName) {
  // jshint camelcase: false
  const model = Implementation.getModels()[collectionAndFieldName.split('.')[0]];
  const modelName = Implementation.getModelName(model);
  const referenceName = `${modelName}.id`;
  const collectionDisplayName = _.capitalize(modelName);

  apimap.push({
    name: `${modelName}_stripe_payments`,
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: `${Implementation.getModelNameOld(model)}_stripe_payments`,
    displayName: `${collectionDisplayName} Payments`,
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isFilterable: false },
      { field: 'created', type: 'Date', isFilterable: false },
      { field: 'amount', type: 'Number', isFilterable: false },
      { field: 'status', type: 'String', isFilterable: false },
      { field: 'currency', type: 'String', isFilterable: false },
      { field: 'refunded', type: 'Boolean', isFilterable: false },
      { field: 'description', type: 'String', isFilterable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isFilterable: false,
      },
    ],
    actions: [{
      id: 'stripe.Refund',
      name: 'Refund',
      endpoint: `/forest/${modelName}_stripe_payments/refunds`,
    }],
  });

  apimap.push({
    name: `${modelName}_stripe_invoices`,
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: `${Implementation.getModelNameOld(model)}_stripe_invoices`,
    displayName: `${collectionDisplayName} Invoices`,
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isFilterable: false },
      { field: 'amount_due', type: 'Number', isFilterable: false },
      { field: 'attempt_count', type: 'Number', isFilterable: false },
      { field: 'attempted', type: 'Boolean', isFilterable: false },
      { field: 'closed', type: 'Boolean', isFilterable: false },
      { field: 'currency', type: 'String', isFilterable: false },
      { field: 'date', type: 'Date', isFilterable: false },
      { field: 'forgiven', type: 'Boolean', isFilterable: false },
      { field: 'period_start', type: 'Date', isFilterable: false },
      { field: 'period_end', type: 'Date', isFilterable: false },
      { field: 'subtotal', type: 'Number', isFilterable: false },
      { field: 'total', type: 'Number', isFilterable: false },
      { field: 'application_fee', type: 'Number', isFilterable: false },
      { field: 'tax', type: 'Number', isFilterable: false },
      { field: 'tax_percent', type: 'Number', isFilterable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isFilterable: false,
      },
    ],
  });

  apimap.push({
    name: `${modelName}_stripe_cards`,
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: `${Implementation.getModelNameOld(model)}_stripe_cards`,
    displayName: `${collectionDisplayName} Cards`,
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isFilterable: false },
      { field: 'last4', type: 'String', isFilterable: false },
      { field: 'brand', type: 'String', isFilterable: false },
      { field: 'funding', type: 'String', isFilterable: false },
      { field: 'exp_month', type: 'Number', isFilterable: false },
      { field: 'exp_year', type: 'Number', isFilterable: false },
      { field: 'country', type: 'String', isFilterable: false },
      { field: 'name', type: 'String', isFilterable: false },
      { field: 'address_line1', type: 'String', isFilterable: false },
      { field: 'address_line2', type: 'String', isFilterable: false },
      { field: 'address_city', type: 'String', isFilterable: false },
      { field: 'address_state', type: 'String', isFilterable: false },
      { field: 'address_zip', type: 'String', isFilterable: false },
      { field: 'address_country', type: 'String', isFilterable: false },
      { field: 'cvc_check', type: 'String', isFilterable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isFilterable: false,
      },
    ],
  });

  apimap.push({
    name: `${modelName}_stripe_subscriptions`,
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: `${Implementation.getModelNameOld(model)}_stripe_subscriptions`,
    displayName: `${collectionDisplayName} Subscriptions`,
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isFilterable: false },
      { field: 'cancel_at_period_end', type: 'Boolean', isFilterable: false },
      { field: 'canceled_at', type: 'Date', isFilterable: false },
      { field: 'created', type: 'Date', isFilterable: false },
      { field: 'current_period_end', type: 'Date', isFilterable: false },
      { field: 'current_period_start', type: 'Date', isFilterable: false },
      { field: 'ended_at', type: 'Date', isFilterable: false },
      { field: 'livemode', type: 'Boolean', isFilterable: false },
      { field: 'quantity', type: 'Number', isFilterable: false },
      { field: 'start', type: 'Date', isFilterable: false },
      { field: 'status', type: 'String', isFilterable: false },
      { field: 'tax_percent', type: 'Number', isFilterable: false },
      { field: 'trial_end', type: 'Date', isFilterable: false },
      { field: 'trial_start', type: 'Date', isFilterable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isFilterable: false,
      },
    ],
  });

  apimap.push({
    name: `${modelName}_stripe_bank_accounts`,
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: `${Implementation.getModelNameOld(model)}_stripe_bank_accounts`,
    displayName: `${collectionDisplayName} Bank Accounts`,
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isFilterable: false },
      { field: 'account', type: 'String', isFilterable: false },
      { field: 'account_holder_name', type: 'String', isFilterable: false },
      { field: 'account_holder_type', type: 'String', isFilterable: false },
      { field: 'bank_name', type: 'String', isFilterable: false },
      { field: 'country', type: 'String', isFilterable: false },
      { field: 'currency', type: 'String', isFilterable: false },
      { field: 'default_for_currency', type: 'Boolean', isFilterable: false },
      { field: 'fingerprint', type: 'String', isFilterable: false },
      { field: 'last4', type: 'String', isFilterable: false },
      { field: 'rooting_number', type: 'String', isFilterable: false },
      { field: 'status', type: 'String', isFilterable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isFilterable: false,
      },
    ],
  });
};

exports.createFields = function (implementation, model, schemaFields) {
  schemaFields.push({
    field: 'stripe_payments',
    displayName: 'Payments',
    type: ['String'],
    reference: `${implementation.getModelName(model)}_stripe_payments.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
  });

  schemaFields.push({
    field: 'stripe_invoices',
    displayName: 'Invoices',
    type: ['String'],
    reference: `${implementation.getModelName(model)}_stripe_invoices.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
  });

  schemaFields.push({
    field: 'stripe_cards',
    displayName: 'Cards',
    type: ['String'],
    reference: `${implementation.getModelName(model)}_stripe_cards.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
  });

  schemaFields.push({
    field: 'stripe_subscriptions',
    displayName: 'Subscriptions',
    type: ['String'],
    reference: `${implementation.getModelName(model)}_stripe_subscriptions.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
  });

  schemaFields.push({
    field: 'stripe_bank_accounts',
    displayName: 'Bank Accounts',
    type: ['String'],
    reference: `${implementation.getModelName(model)}_stripe_bank_accounts.id`,
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
  });
};
