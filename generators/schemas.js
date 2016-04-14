'use strict';
var P = require('bluebird');

module.exports = {
  schemas: {},
  perform: function (implementation, models, opts) {
    var that = this;
    return P
      .each(models, function (model) {
        return new implementation.SchemaAdapter(model, opts)
          .then(function (schema) {
            function hasStripeIntegration() {
              return opts.integrations && opts.integrations.stripe &&
                opts.integrations.stripe.apiKey;
            }

            function setupStripeIntegration() {
              schema.fields.push({
                field: 'stripe_payments',
                type: ['String'],
                reference: 'stripe_payments.id',
                column: null,
                isSearchable: false,
                integration: 'stripe'
              });

              schema.fields.push({
                field: 'stripe_invoices',
                type: ['String'],
                reference: 'stripe_invoices.id',
                column: null,
                isSearchable: false,
                integration: 'stripe'
              });

              schema.fields.push({
                field: 'stripe_cards',
                type: ['String'],
                reference: 'stripe_cards.id',
                column: null,
                isSearchable: false,
                integration: 'stripe'
              });
            }

            if (hasStripeIntegration() &&
              opts.integrations.stripe.userCollection ===
              implementation.getModelName(model)) {
              setupStripeIntegration();
            }

            return schema;
          })
          .then(function (schema) {
            that.schemas[implementation.getModelName(model)] = schema;
          });
      });
  }
};
