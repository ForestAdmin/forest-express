'use strict';
var _ = require('lodash');

var INTEGRATION_NAME = 'stripe';

exports.createCollections = function (Implementation, apimap,
                                      collectionAndFieldName) {
  // jshint camelcase: false
  var model = Implementation.getModels()[collectionAndFieldName.split('.')[0]];
  var modelName = Implementation.getModelName(model);
  var referenceName = modelName + '.id';
  var collectionDisplayName = _.capitalize(modelName);

  apimap.push({
    name: modelName + '_stripe_payments',
    displayName: collectionDisplayName + ' Payments',
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'created', type: 'Date', isSearchable: false },
      { field: 'amount', type: 'Number', isSearchable: false },
      { field: 'status', type: 'String', isSearchable: false },
      { field: 'currency', type: 'String', isSearchable: false },
      { field: 'refunded', type: 'Boolean', isSearchable: false },
      { field: 'description', type: 'String', isSearchable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        'isSearchable': false
      }
    ],
    actions: [{
      id: 'stripe.Refund',
      name: 'Refund',
      endpoint: '/forest/' + modelName + '_stripe_payments/refunds'
    }]
  });

  apimap.push({
    name: modelName + '_stripe_invoices',
    displayName: collectionDisplayName + ' Invoices',
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'amount_due', type: 'Number', isSearchable: false },
      { field: 'attempt_count', type: 'Number', isSearchable: false },
      { field: 'attempted', type: 'Boolean', isSearchable: false },
      { field: 'closed', type: 'Boolean', isSearchable: false },
      { field: 'currency', type: 'String', isSearchable: false },
      { field: 'date', type: 'Date', isSearchable: false },
      { field: 'forgiven', type: 'Boolean', isSearchable: false },
      { field: 'period_start', type: 'Date', isSearchable: false },
      { field: 'period_end', type: 'Date', isSearchable: false },
      { field: 'subtotal', type: 'Number', isSearchable: false },
      { field: 'total', type: 'Number', isSearchable: false },
      { field: 'application_fee', type: 'Number', isSearchable: false },
      { field: 'tax', type: 'Number', isSearchable: false },
      { field: 'tax_percent', type: 'Number', isSearchable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isSearchable: false
      }
    ]
  });

  apimap.push({
    name: modelName + '_stripe_cards',
    displayName: collectionDisplayName + ' Cards',
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'last4', type: 'String', isSearchable: false },
      { field: 'brand', type: 'String', isSearchable: false },
      { field: 'funding', type: 'String', isSearchable: false },
      { field: 'exp_month', type: 'Number', isSearchable: false },
      { field: 'exp_year', type: 'Number', isSearchable: false },
      { field: 'country', type: 'String', isSearchable: false },
      { field: 'name', type: 'String', isSearchable: false },
      { field: 'address_line1', type: 'String', isSearchable: false },
      { field: 'address_line2', type: 'String', isSearchable: false },
      { field: 'address_city', type: 'String', isSearchable: false },
      { field: 'address_state', type: 'String', isSearchable: false },
      { field: 'address_zip', type: 'String', isSearchable: false },
      { field: 'address_country', type: 'String', isSearchable: false },
      { field: 'cvc_check', type: 'String', isSearchable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isSearchable: false
      }
    ]
  });

  apimap.push({
    name: modelName + '_stripe_subscriptions',
    displayName: collectionDisplayName + ' Subscriptions',
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'cancel_at_period_end', type: 'Boolean', isSearchable: false },
      { field: 'canceled_at', type: 'Date', isSearchable: false },
      { field: 'created', type: 'Date', isSearchable: false },
      { field: 'current_period_end', type: 'Date', isSearchable: false },
      { field: 'current_period_start', type: 'Date', isSearchable: false },
      { field: 'ended_at', type: 'Date', isSearchable: false },
      { field: 'livemode', type: 'Boolean', isSearchable: false },
      { field: 'quantity', type: 'Number', isSearchable: false },
      { field: 'start', type: 'Date', isSearchable: false },
      { field: 'status', type: 'String', isSearchable: false },
      { field: 'tax_percent', type: 'Number', isSearchable: false },
      { field: 'trial_end', type: 'Date', isSearchable: false },
      { field: 'trial_start', type: 'Date', isSearchable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isSearchable: false
      }
    ]
  });

  apimap.push({
    name: modelName + '_stripe_bank_accounts',
    displayName: collectionDisplayName + ' Bank Accounts',
    icon: 'stripe',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    paginationType: 'cursor',
    fields: [
      { field: 'id', type: 'String', isSearchable: false },
      { field: 'account', type: 'String', isSearchable: false },
      { field: 'account_holder_name', type: 'String', isSearchable: false },
      { field: 'account_holder_type', type: 'String', isSearchable: false },
      { field: 'bank_name', type: 'String', isSearchable: false },
      { field: 'country', type: 'String', isSearchable: false },
      { field: 'currency', type: 'String', isSearchable: false },
      { field: 'default_for_currency', type: 'Boolean', isSearchable: false },
      { field: 'fingerprint', type: 'String', isSearchable: false },
      { field: 'last4', type: 'String', isSearchable: false },
      { field: 'rooting_number', type: 'String', isSearchable: false },
      { field: 'status', type: 'String', isSearchable: false },
      {
        field: 'customer',
        type: 'String',
        reference: referenceName,
        isSearchable: false
      }
    ]
  });
};

exports.createFields = function (implementation, model, schemaFields) {
  schemaFields.push({
    field: 'stripe_payments',
    displayName: 'Payments',
    type: ['String'],
    reference: implementation.getModelName(model) + '_stripe_payments.id',
    column: null,
    isSearchable: false,
    integration: INTEGRATION_NAME
  });

  schemaFields.push({
    field: 'stripe_invoices',
    displayName: 'Invoices',
    type: ['String'],
    reference: implementation.getModelName(model) + '_stripe_invoices.id',
    column: null,
    isSearchable: false,
    integration: INTEGRATION_NAME
  });

  schemaFields.push({
    field: 'stripe_cards',
    displayName: 'Cards',
    type: ['String'],
    reference: implementation.getModelName(model) + '_stripe_cards.id',
    column: null,
    isSearchable: false,
    integration: INTEGRATION_NAME
  });

  schemaFields.push({
    field: 'stripe_subscriptions',
    displayName: 'Subscriptions',
    type: ['String'],
    reference: implementation.getModelName(model) + '_stripe_subscriptions.id',
    column: null,
    isSearchable: false,
    integration: INTEGRATION_NAME
  });

  schemaFields.push({
    field: 'stripe_bank_accounts',
    displayName: 'Bank Accounts',
    type: ['String'],
    reference: implementation.getModelName(model) + '_stripe_bank_accounts.id',
    column: null,
    isSearchable: false,
    integration: INTEGRATION_NAME
  });
};
