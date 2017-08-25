'use strict';
var _ = require('lodash');
var logger = require('../../services/logger');
var Routes = require('./routes');
var Setup = require('./setup');

function IntercomChecker(opts, Implementation) {
  var integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.intercom;
  }

  function isProperlyIntegrated() {
    return opts.integrations.intercom.apiKey &&
      opts.integrations.intercom.appId && opts.integrations.intercom.intercom &&
      opts.integrations.intercom.mapping;
  }

  function isMappingValid() {
    var models = Implementation.getModels();
    var mappingValid = true;
    _.map(opts.integrations.intercom.mapping, function (mappingValue) {
      var collectionName = mappingValue.split('.')[0];
      if (!models[collectionName]) {
        mappingValid = false;
      }
    });

    if (!mappingValid) {
      logger.error('Cannot find some Intercom integration mapping values (' +
        opts.integrations.intercom.mapping + ') among the project models:\n' +
        _.keys(models).join(', '));
    }

    return mappingValid;
  }

  function isIntegrationDeprecated() {
    var integrationValid = opts.integrations.intercom.apiKey &&
      opts.integrations.intercom.appId &&
      opts.integrations.intercom.intercom &&
      opts.integrations.intercom.userCollection;

    if (integrationValid) {
      logger.warn('Intercom integration attribute "userCollection" is now ' +
        'deprecated, please use "mapping" attribute.');
      opts.integrations.intercom.mapping =
        opts.integrations.intercom.userCollection;
    }

    return integrationValid;
  }

  function castToArray(value) {
    return _.isString(value) ? [value] : value;
  }

  function integrationCollectionMatch(integration, model) {
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

  if (hasIntegration()) {
    if (isProperlyIntegrated() ||
      isIntegrationDeprecated()) {
      opts.integrations.intercom.mapping =
      castToArray(opts.integrations.intercom.mapping);
      integrationValid = isMappingValid();
    } else {
      logger.error('Cannot setup properly your Intercom integration.');
    }
  }

  this.defineRoutes = function (app, model) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.intercom, model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = function (collections) {
    if (!integrationValid) { return; }

    _.each(opts.integrations.intercom.mapping,
      function (collectionName) {
        Setup.createCollections(Implementation, collections, collectionName);
      });
  };

  this.defineFields = function (model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(Implementation, opts.integrations.intercom,
      model)) {
        Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = function (model, schema, dest, field) {
    if (integrationValid && field.integration === 'intercom') {
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

module.exports = IntercomChecker;
