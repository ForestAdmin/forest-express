'use strict';
var _ = require('lodash');
var P = require('bluebird');

module.exports = {
  schemas: {},
  perform: function (implementation, models, opts) {
    var that = this;
    return P
      .each(models, function (model) {
        return new implementation.SchemaAdapter(model, opts)
          .then(function (schema) {
            function hasIntercomIntegration() {
              return opts.integrations && opts.integrations.intercom &&
                opts.integrations.intercom.apiKey &&
                opts.integrations.intercom.appId;
            }

            function hasStripeIntegration() {
              return opts.integrations && opts.integrations.stripe &&
                opts.integrations.stripe.apiKey;
            }

            function integrationCollectionMatch(integration) {
              var models = implementation.getModels();

              var collectionModelNames = _.map(integration.mapping,
                function (mappingValue) {
                  var collectionName = mappingValue.split('.')[0];
                  if (models[collectionName]) {
                    return implementation.getModelName(models[collectionName]);
                  }
                });

              return collectionModelNames.indexOf(
                implementation.getModelName(model)) > -1;
            }

            function setupIntercomIntegration() {
              schema.fields.push({
                field: 'intercom_conversations',
                type: ['String'],
                reference: implementation.getModelName(model) +
                  '_intercom_conversations.id',
                column: null,
                isSearchable: false,
                integration: 'intercom'
              });

              schema.fields.push({
                field: 'intercom_attributes',
                type: 'String',
                reference: implementation.getModelName(model) +
                  '_intercom_attributes.id',
                column: null,
                isSearchable: false,
                integration: 'intercom'
              });
            }

            function setupStripeIntegration() {
              schema.fields.push({
                field: 'stripe_payments',
                type: ['String'],
                reference: implementation.getModelName(model) +
                  '_stripe_payments.id',
                column: null,
                isSearchable: false,
                integration: 'stripe'
              });

              schema.fields.push({
                field: 'stripe_invoices',
                type: ['String'],
                reference: implementation.getModelName(model) +
                  '_stripe_invoices.id',
                column: null,
                isSearchable: false,
                integration: 'stripe'
              });

              schema.fields.push({
                field: 'stripe_cards',
                type: ['String'],
                reference: implementation.getModelName(model) +
                  '_stripe_cards.id',
                column: null,
                isSearchable: false,
                integration: 'stripe'
              });
            }

            if (hasIntercomIntegration() &&
              integrationCollectionMatch(opts.integrations.intercom)) {
              setupIntercomIntegration();
            }

            if (hasStripeIntegration() &&
              integrationCollectionMatch(opts.integrations.stripe)) {
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
