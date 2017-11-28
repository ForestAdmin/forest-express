'use strict';
var _ = require('lodash');
var logger = require('../../services/logger');
var Setup = require('./setup');
var Routes = require('./routes');

function Checker(opts, Implementation) {
  var integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.mixpanel;
  }

  function isProperlyIntegrated() {
    return opts.integrations.mixpanel.apiKey &&
      opts.integrations.mixpanel.apiSecret &&
      opts.integrations.mixpanel.mapping && opts.integrations.mixpanel.mixpanel;
  }

  function isMappingValid() {
    var models = Implementation.getModels();
    var collectionName = opts.integrations.mixpanel.mapping.split('.')[0];
    var mappingValid = !!models[collectionName];

    if (!mappingValid) {
      logger.error('Cannot find some Mixpanel integration mapping values (' +
        opts.integrations.mixpanel.mapping + ') among the project models:\n' +
        _.keys(models).join(', '));
    }

    return mappingValid;
  }

  function integrationCollectionMatch(integration, model) {
    if (!integrationValid) { return; }

    var models = Implementation.getModels();
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

    if (integrationCollectionMatch(opts.integrations.mixpanel, model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = function (model, schema) {
    if (!integrationValid) { return; }

    Setup.createCollections(Implementation, model, schema, opts);
  };

  this.defineSegments = function (model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.mixpanel, model)) {
      Setup.createSegments(Implementation, model, schema, opts);
    }
  };

  this.defineFields = function (model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.mixpanel, model)) {
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
              href: '/forest/' + Implementation.getModelName(model) +
                '/' + dataSet[schema.idField] + '/relationships/' + field.field,
            };
          }
        }
      };
    }
  };
}

module.exports = Checker;
