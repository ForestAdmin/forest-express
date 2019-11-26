const _ = require('lodash');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const Schemas = require('../../../generators/schemas');

function BankAccountsSerializer(bankAccounts, collectionName, meta) {
  function getCustomerAttributes() {
    if (!bankAccounts.length) { return []; }

    const schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  const customerAttributes = getCustomerAttributes();

  const type = `${collectionName}_stripe_bank_accounts`;

  return new JSONAPISerializer(type, bankAccounts, {
    attributes: ['account', 'account_holder_name', 'account_holder_type',
      'bank_name', 'country', 'currency', 'default_for_currency', 'fingerprint',
      'last4', 'rooting_number', 'status', 'customer'],
    customer: {
      ref: Schemas.schemas[collectionName].idField,
      attributes: customerAttributes,
    },
    keyForAttribute(key) { return key; },
    typeForAttribute(attr) {
      if (attr === 'customer') { return collectionName; }
      return attr;
    },
    meta,
  });
}

module.exports = BankAccountsSerializer;
