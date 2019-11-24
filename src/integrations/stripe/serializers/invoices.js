const _ = require('lodash');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const Schemas = require('../../../generators/schemas');

function InvoicesSerializer(invoices, collectionName, meta) {
  function getCustomerAttributes() {
    if (!invoices.length) { return []; }

    const schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  function format(invoice) {
    // jshint camelcase: false
    invoice.date = new Date(invoice.date * 1000);

    if (invoice.period_start) {
      invoice.period_start = new Date(invoice.period_start * 1000);
    }

    if (invoice.period_end) {
      invoice.period_end = new Date(invoice.period_end * 1000);
    }

    if (invoice.subtotal) { invoice.subtotal /= 100; }
    if (invoice.total) { invoice.total /= 100; }

    return invoice;
  }

  const customerAttributes = getCustomerAttributes();

  if (invoices.length) {
    invoices = invoices.map(format);
  } else {
    invoices = format(invoices);
  }

  const type = `${collectionName}_stripe_invoices`;

  return new JSONAPISerializer(type, invoices, {
    attributes: ['amount_due', 'attempt_count', 'attempted', 'closed',
      'currency', 'date', 'forgiven', 'paid', 'period_start', 'period_end',
      'subtotal', 'total', 'application_fee', 'tax', 'tax_percent',
      'customer'],
    customer: {
      ref: Schemas.schemas[collectionName].idField,
      attributes: customerAttributes,
    },
    keyForAttribute: (key) => key,
    typeForAttribute: (attr) => {
      if (attr === 'customer') { return collectionName; }
      return attr;
    },
    meta,
  });
}

module.exports = InvoicesSerializer;
