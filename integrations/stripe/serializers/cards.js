'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../../../generators/schemas');
var StringsUtil = require('../../../utils/strings');

function CardsSerializer(cards, collectionName, meta) {
  function getCustomerAttributes() {
    if (!cards.length) { return []; }

    var schema = Schemas.schemas[collectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  var customerAttributes = getCustomerAttributes();

  var type = StringsUtil.camelCaseToDashed(collectionName) + '-stripe-cards';

  return new JSONAPISerializer(type, cards, {
    attributes: ['last4', 'brand', 'funding', 'exp_month', 'exp_year',
      'country', 'name', 'address_line1', 'address_line2', 'address_city',
      'address_state', 'address_zip', 'address_country', 'cvc_check',
      'customer'],
    customer: {
      ref: 'id',
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

module.exports = CardsSerializer;

