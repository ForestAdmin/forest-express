'use strict';
var _ = require('lodash');
var P = require('bluebird');
var StripeSetup = require('../integrations/stripe/setup');

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

            if (hasIntercomIntegration() &&
              integrationCollectionMatch(opts.integrations.intercom)) {
              setupIntercomIntegration();
            }

            if (hasStripeIntegration() &&
              integrationCollectionMatch(opts.integrations.stripe)) {
              StripeSetup.createFields(implementation, model, schema.fields);
            }

            return schema;
          })
          .then(function (schema) {
            that.schemas[implementation.getModelName(model)] = schema;
          });
      });
  }
};
