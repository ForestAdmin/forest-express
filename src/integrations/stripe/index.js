const { inject } = require('@forestadmin/context');
const _ = require('lodash');
const logger = require('../../services/logger');
const Routes = require('./routes');
const Setup = require('./setup');

function Checker(opts, Implementation) {
  const { modelsManager } = inject();
  let integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.stripe && opts.integrations.stripe.apiKey;
  }

  function isProperlyIntegrated() {
    return opts.integrations.stripe.apiKey
      && opts.integrations.stripe.stripe
      && opts.integrations.stripe.mapping;
  }

  function isIntegrationDeprecated() {
    const isIntegrationValid = opts.integrations.stripe.apiKey
      && opts.integrations.stripe.stripe
      && (opts.integrations.stripe.userCollection || opts.integrations.stripe.userCollection);

    if (isIntegrationValid) {
      logger.warn('Stripe integration attributes "userCollection" and "userField" are now deprecated, please use "mapping" attribute.');
      opts.integrations.stripe.mapping = `${opts.integrations.stripe.userCollection}.${opts.integrations.stripe.userField}`;
    }

    return isIntegrationValid;
  }

  function isMappingValid() {
    const models = modelsManager.getModels();
    let mappingValid = true;
    _.map(opts.integrations.stripe.mapping, (mappingValue) => {
      const collectionName = mappingValue.split('.')[0];
      if (!models[collectionName]) {
        mappingValid = false;
      }
    });

    if (!mappingValid) {
      logger.error(`Cannot find some Stripe integration mapping values (${
        opts.integrations.stripe.mapping}) among the project models:\n${
        _.keys(models).join(', ')}`);
    }

    return mappingValid;
  }

  function castToArray(value) {
    return _.isString(value) ? [value] : value;
  }

  function integrationCollectionMatch(integration, model) {
    if (!integrationValid) { return false; }

    const models = modelsManager.getModels();

    const collectionModelNames = _.map(
      integration.mapping,
      (mappingValue) => {
        const collectionName = mappingValue.split('.')[0];
        if (models[collectionName]) {
          return Implementation.getModelName(models[collectionName]);
        }
        return null;
      },
    );

    return collectionModelNames.indexOf(Implementation.getModelName(model)) > -1;
  }

  if (hasIntegration()) {
    if (isProperlyIntegrated() || isIntegrationDeprecated()) {
      opts.integrations.stripe.mapping = castToArray(opts.integrations.stripe.mapping);
      integrationValid = isMappingValid();
    } else {
      logger.error('Cannot setup properly your Stripe integration.');
    }
  }

  this.defineRoutes = (app, model) => {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.stripe, model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = (collections) => {
    if (!integrationValid) { return; }

    _.each(
      opts.integrations.stripe.mapping,
      (collectionAndFieldName) => {
        Setup.createCollections(Implementation, collections, collectionAndFieldName);
      },
    );
  };

  this.defineFields = (model, schema) => {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.stripe, model)) {
      Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = (model, schema, dest, field) => {
    if (integrationValid && field.integration === 'stripe') {
      dest[field.field] = {
        ref: 'id',
        attributes: [],
        included: false,
        nullIfMissing: true, // TODO: This option in the JSONAPISerializer is weird.
        ignoreRelationshipData: true,
        relationshipLinks: {
          related(dataSet) {
            return {
              href: `/forest/${Implementation.getModelName(model)
              }/${dataSet[schema.idField]}/${field.field}`,
            };
          },
        },
      };
    }
  };
}

module.exports = Checker;
