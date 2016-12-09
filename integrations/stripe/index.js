'use strict';
var _ = require('lodash');
var logger = require('../../services/logger');
var Routes = require('./routes');
var Setup = require('./setup');

function Checker(opts) {
  var integrationValid = false;

  function hasStripeIntegration() {
    return opts.integrations && opts.integrations.stripe &&
      opts.integrations.stripe.apiKey;
  }

  function isStripeProperlyIntegrated() {
    return opts.integrations.stripe.apiKey &&
      opts.integrations.stripe.stripe && opts.integrations.stripe.mapping;
  }

  function isStripeIntegrationDeprecated() {
    var integrationValid = opts.integrations.stripe.apiKey &&
      opts.integrations.stripe.stripe &&
        (opts.integrations.stripe.userCollection ||
          opts.integrations.stripe.userCollection);

    if (integrationValid) {
      logger.warn('Stripe integration attributes "userCollection" and ' +
        '"userField" are now deprecated, please use "mapping" attribute.');
      opts.integrations.stripe.mapping =
        opts.integrations.stripe.userCollection + '.' +
          opts.integrations.stripe.userField;
    }

    return integrationValid;
  }

  function castToArray(value) {
    return _.isString(value) ? [value] : value;
  }

  function integrationCollectionMatch(Implementation, integration, model) {
    if (!integrationValid) { return; }

    var models = Implementation.getModels();

    var collectionModelNames = _.map(integration.mapping,
      function (mappingValue) {
        var collectionName = mappingValue.split('.')[0];
        if (models[collectionName]) {
          return Implementation.getModelName(models[collectionName]);
        }
      });

    return collectionModelNames.indexOf(
      Implementation.getModelName(model)) > -1;
  }

  if (hasStripeIntegration()) {
    if (isStripeProperlyIntegrated() || isStripeIntegrationDeprecated()) {
      opts.integrations.stripe.mapping =
        castToArray(opts.integrations.stripe.mapping);
      integrationValid = true;
    } else {
      logger.error('Cannot setup properly your Stripe integration.');
    }
  }

  this.defineRoutes = function (app, model, Implementation) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(Implementation, opts.integrations.stripe,
      model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = function (Implementation, collections) {
    if (!integrationValid) { return; }

    _.each(opts.integrations.stripe.mapping,
      function (collectionAndFieldName) {
        Setup.createCollections(Implementation, collections,
        collectionAndFieldName);
      });
  };

  this.defineFields = function (Implementation, model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(Implementation, opts.integrations.stripe,
      model)) {
        Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = function (Implementation, model, schema,
    dest, field) {
    if (integrationValid && field.integration === 'stripe') {
      dest[field.field] = {
        ref: 'id',
        attributes: [],
        included: false,
        nullIfMissing: true, // TODO: This option in the JSONAPISerializer is weird.
        ignoreRelationshipData: true,
        relationshipLinks: {
          related: function (dataSet) {
            var ret = {
              href: '/forest/' + Implementation.getModelName(model) +
                '/' + dataSet[schema.idField] + '/' + field.field,
            };
            return ret;
          }
        }
      };
    }
  };
}

module.exports = Checker;
