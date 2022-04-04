const { inject } = require('@forestadmin/context');
const _ = require('lodash');
const logger = require('../../services/logger');
const Setup = require('./setup');
const Routes = require('./routes');

function Checker(options, Implementation) {
  const { modelsManager } = inject();
  let integrationValid = false;

  function hasIntegration() {
    return options.integrations && options.integrations.mixpanel;
  }

  function isProperlyIntegrated() {
    return options.integrations.mixpanel.apiKey
      && options.integrations.mixpanel.apiSecret
      && options.integrations.mixpanel.mapping
      && options.integrations.mixpanel.mixpanel;
  }

  function isMappingValid() {
    const models = modelsManager.getModels();
    let mappingValid = true;
    _.map(options.integrations.mixpanel.mapping, (mappingValue) => {
      const collectionName = mappingValue.split('.')[0];
      if (!models[collectionName]) {
        mappingValid = false;
      }
    });

    if (!mappingValid) {
      logger.error(`Cannot find some Mixpanel integration mapping values (${
        options.integrations.mixpanel.mapping}) among the project models:\n${
        _.keys(models).join(', ')}`);
    }

    return mappingValid;
  }

  function stringToArray(value) {
    return _.isString(value) ? [value] : value;
  }

  function integrationCollectionMatch(integration, model) {
    if (!integrationValid) { return false; }

    const models = modelsManager.getModels();

    const collectionModelNames = _.map(integration.mapping, (mappingValue) => {
      const collectionName = mappingValue.split('.')[0];
      if (models[collectionName]) {
        return Implementation.getModelName(models[collectionName]);
      }
      return null;
    });

    return collectionModelNames.indexOf(Implementation.getModelName(model)) > -1;
  }

  if (hasIntegration()) {
    if (isProperlyIntegrated()) {
      options.integrations.mixpanel.mapping = stringToArray(options.integrations.mixpanel.mapping);
      integrationValid = isMappingValid();
    } else {
      logger.error('Cannot setup properly your Mixpanel integration.');
    }
  }

  this.defineRoutes = (app, model) => {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(options.integrations.mixpanel, model)) {
      new Routes(app, model, Implementation, options).perform();
    }
  };

  this.defineCollections = (collections) => {
    if (!integrationValid) { return; }

    _.each(
      options.integrations.mixpanel.mapping,
      (collectionAndFieldName) => {
        Setup.createCollections(Implementation, collections, collectionAndFieldName, options);
      },
    );
  };

  this.defineFields = (model, schema) => {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(options.integrations.mixpanel, model)) {
      Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = (model, schema, dest, field) => {
    if (integrationValid && field.integration === 'mixpanel') {
      dest[field.field] = {
        ref: 'id',
        attributes: [],
        included: false,
        nullIfMissing: true, // TODO: This option in the JSONAPISerializer is weird.
        ignoreRelationshipData: true,
        relationshipLinks: {
          related(dataSet) {
            return {
              href: `/forest/${Implementation.getModelName(model)}/${dataSet[schema.idField]}/relationships/${field.field}`,
            };
          },
        },
      };
    }
  };
}

module.exports = Checker;
