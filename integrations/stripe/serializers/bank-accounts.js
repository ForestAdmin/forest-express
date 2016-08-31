'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../../../generators/schemas');
var StringsUtil = require('../../../utils/strings');

function BankAccountsSerializer(bankAccounts, collectionName, meta) {
  function getCustomerAttributes() {
    if (!bankAccounts.length) { return []; }

    var schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  var customerAttributes = getCustomerAttributes();

  var type = StringsUtil.camelCaseToDashed(collectionName) +
    '-stripe-bank-accounts';

  return new JSONAPISerializer(type, bankAccounts, {
    attributes: ['account', 'account_holder_name', 'account_holder_type',
      'bank_name', 'country', 'currency', 'default_for_currency', 'fingerprint',
      'last4', 'rooting_number', 'status', 'customer'],
    customer: {
      ref: Schemas.schemas[collectionName].idField,
      attributes: customerAttributes
    },
    keyForAttribute: function (key) { return key; },
    typeForAttribute: function (attr) {
      if (attr === 'customer') { return collectionName; }
      return attr;
    },
    meta: meta
  });
}

module.exports = BankAccountsSerializer;

