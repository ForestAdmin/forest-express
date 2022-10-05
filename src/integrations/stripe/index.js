const { inject } = require('@forestadmin/context');
const _ = require('lodash');
const logger = require('../../services/logger');
const Routes = require('./routes');
const Setup = require('./setup');

function Checker(opts, Implementation) {
  const { modelsManager } = inject();
  let integrationValid = false;

  function upgradeIntegrationInPlace(stripe) {
    // Transform userCollection + userField => mapping
    if (stripe.userCollection || stripe.userField) {
      logger.warn('Stripe integration attributes "userCollection" and "userField" are now deprecated, please use "mapping" attribute.');
      stripe.mapping = `${stripe.userCollection}.${stripe.userField}`;

      delete stripe.userCollection;
      delete stripe.userField;
    }

    // Transform mapping to array
    if (_.isString(stripe.mapping)) {
      stripe.mapping = [stripe.mapping];
    }
  }

  function isMappingValid(stripe) {
    const models = modelsManager.getModels();
    const mappingValid = _.every(stripe.mapping, (mappingValue) => {
      const collectionName = mappingValue.split('.')[0];
      const fieldName = mappingValue.split('.')[1];

      if (!models[collectionName]) {
        return false;
      }

      // if sequelize -> false
      return !(models[collectionName].rawAttributes
        && !models[collectionName].rawAttributes[fieldName]);
    });

    if (!mappingValid) {
      logger.error(`Cannot find some Stripe integration mapping values (${
        stripe.mapping}) among the project models:\n${
        _.keys(models).join(', ')}`);
    }

    return mappingValid;
  }

  function isProperlyIntegrated(stripe) {
    let isValid = true;

    // Check apikey and stripe
    if (!stripe.apiKey) {
      logger.error('Stripe integration attribute "apiKey" is missing');
      isValid = false;
    }

    if (!stripe.stripe) {
      logger.error('Stripe integration attribute "stripe" is missing');
      isValid = false;
    }

    // Check that mapping is valid
    if (!Array.isArray(stripe.mapping)) {
      logger.error('Stripe integration attribute "mapping" is invalid');
      isValid = false;
    }

    return isValid && isMappingValid(stripe);
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

  if (opts.integrations && opts.integrations.stripe) {
    upgradeIntegrationInPlace(opts.integrations.stripe);
    integrationValid = isProperlyIntegrated(opts.integrations.stripe);
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
