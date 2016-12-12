'use strict';
var _ = require('lodash');
var logger = require('../../services/logger');
var Routes = require('./routes');
var Setup = require('./setup');

function IntercomChecker(opts) {
  var integrationValid = false;

  function hasIntercomIntegration() {
    return opts.integrations && opts.integrations.intercom;
  }

  function isIntercomProperlyIntegrated() {
    return opts.integrations.intercom.apiKey &&
      opts.integrations.intercom.appId && opts.integrations.intercom.intercom &&
      opts.integrations.intercom.mapping;
  }

  function isIntercomIntegrationDeprecated() {
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

  if (hasIntercomIntegration()) {
    if (isIntercomProperlyIntegrated() ||
    isIntercomIntegrationDeprecated()) {
      opts.integrations.intercom.mapping =
      castToArray(opts.integrations.intercom.mapping);
      integrationValid = true;
    } else {
      logger.error('Cannot setup properly your Intercom integration.');
    }
  }

  this.defineRoutes = function (app, model, Implementation) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(Implementation, opts.integrations.intercom,
      model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = function (Implementation, collections) {
    if (!integrationValid) { return; }

    _.each(opts.integrations.intercom.mapping,
      function (collectionName) {
        Setup.createCollections(Implementation, collections, collectionName);
      });
  };

  this.defineFields = function (Implementation, model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(Implementation, opts.integrations.intercom,
      model)) {
        Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = function (Implementation, model, schema,
    dest, field) {
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
