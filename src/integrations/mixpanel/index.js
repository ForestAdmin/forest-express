const _ = require('lodash');
const logger = require('../../services/logger');
const Setup = require('./setup');
const Routes = require('./routes');

function Checker(options, Implementation) {
  let integrationValid = false;

  function hasIntegration() {
    return options.integrations && options.integrations.mixpanel;
  }

  function isProperlyIntegrated() {
    return options.integrations.mixpanel.apiKey &&
      options.integrations.mixpanel.apiSecret &&
      options.integrations.mixpanel.mapping && options.integrations.mixpanel.mixpanel;
  }

  function isMappingValid() {
    const models = Implementation.getModels();
    var collectionName = options.integrations.mixpanel.mapping.split('.')[0];
    var mappingValid = !!models[collectionName];

    if (!mappingValid) {
      logger.error('Cannot find some Mixpanel integration mapping values (' +
        options.integrations.mixpanel.mapping + ') among the project models:\n' +
        _.keys(models).join(', '));
    }

    return mappingValid;
  }

  function integrationCollectionMatch(integration, model) {
    if (!integrationValid) { return; }

    const models = Implementation.getModels();
    var collectionName = integration.mapping.split('.')[0];
    return models[collectionName] === model;
  }

  if (hasIntegration()) {
    if (isProperlyIntegrated() && isMappingValid()) {
      integrationValid = true;
    } else {
      logger.error('Cannot setup properly your Mixpanel integration.');
    }
  }

  this.defineRoutes = function (app, model) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(options.integrations.mixpanel, model)) {
      new Routes(app, model, Implementation, options).perform();
    }
  };

  this.defineCollections = function (model, schema) {
    if (!integrationValid) { return; }

    Setup.createCollections(Implementation, model, schema, options);
  };

  this.defineSegments = function (model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(options.integrations.mixpanel, model)) {
      Setup.createSegments(Implementation, model, schema, options);
    }
  };

  this.defineFields = function (model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(options.integrations.mixpanel, model)) {
      Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = function (model, schema, dest, field) {
    if (integrationValid && field.integration === 'mixpanel') {
      dest[field.field] = {
        ref: 'id',
        attributes: [],
        included: false,
        nullIfMissing: true, // TODO: This option in the JSONAPISerializer is weird.
        ignoreRelationshipData: true,
        relationshipLinks: {
          related: function (dataSet) {
            return {
              href: `/forest/${Implementation.getModelName(model)}/${dataSet[schema.idField]}/relationships/${field.field}`,
            };
          }
        }
      };
    }
  };
}

module.exports = Checker;
