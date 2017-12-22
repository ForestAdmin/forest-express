const _ = require('lodash');
const logger = require('../../services/logger');
const Setup = require('./setup');
const Routes = require('./routes');

function Checker(opts, Implementation) {
  let integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.mixpanel;
  }

  function isProperlyIntegrated() {
    return opts.integrations.mixpanel.apiKey &&
      opts.integrations.mixpanel.apiSecret &&
      opts.integrations.mixpanel.mapping && opts.integrations.mixpanel.mixpanel;
  }

  function isMappingValid() {
    const models = Implementation.getModels();
    const collectionName = opts.integrations.mixpanel.mapping.split('.')[0];
    const mappingValid = !!models[collectionName];

    if (!mappingValid) {
      logger.error(`Cannot find some Mixpanel integration mapping values (${
        opts.integrations.mixpanel.mapping}) among the project models:\n${
        _.keys(models).join(', ')}`);
    }

    return mappingValid;
  }

  function integrationCollectionMatch(integration, model) {
    if (!integrationValid) { return null; }

    const models = Implementation.getModels();
    const collectionName = integration.mapping.split('.')[0];
    return models[collectionName] === model;
  }

  if (hasIntegration()) {
    if (isProperlyIntegrated() && isMappingValid()) {
      integrationValid = true;
    } else {
      logger.error('Cannot setup properly your Mixpanel integration.');
    }
  }

  this.defineRoutes = function defineRoutes(app, model) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.mixpanel, model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = function defineCollections(model, schema) {
    if (!integrationValid) { return; }

    Setup.createCollections(Implementation, model, schema, opts);
  };

  this.defineSegments = function defineSegments(model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.mixpanel, model)) {
      Setup.createSegments(Implementation, model, schema, opts);
    }
  };

  this.defineFields = function defineFields(model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.mixpanel, model)) {
      Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = function defineSerializationOption(model, schema, dest, field) {
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
              href: `/forest/${Implementation.getModelName(model)
              }/${dataSet[schema.idField]}/relationships/${field.field}`,
            };
          },
        },
      };
    }
  };
}

module.exports = Checker;
