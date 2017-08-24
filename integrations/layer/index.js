'use strict';
var _ = require('lodash');
var logger = require('../../services/logger');
var Routes = require('./routes');
var Setup = require('./setup');

function Checker(opts) {
  var integrationValid = false;

  function hasLayerIntegration() {
    return opts.integrations && opts.integrations.layer;
  }

  function isLayerProperlyIntegrated() {
    return opts.integrations.layer.serverApiToken &&
      opts.integrations.layer.appId;
  }

  if (hasLayerIntegration()) {
    if (isLayerProperlyIntegrated()) {
      integrationValid = true;
    } else {
      logger.error('Cannot setup properly your Layer integration.');
    }
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

  if (hasLayerIntegration()) {
    if (isLayerProperlyIntegrated()) {
      opts.integrations.layer.mapping =
        castToArray(opts.integrations.layer.mapping);
      integrationValid = true;
    } else {
      logger.error('Cannot setup properly your Layer integration.');
    }
  }

  this.defineRoutes = function (app, model, Implementation) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(Implementation, opts.integrations.layer,
      model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = function (Implementation, collections) {
    if (!integrationValid) { return; }

    _.each(opts.integrations.layer.mapping,
      function (collectionAndFieldName) {
        Setup.createCollections(Implementation, collections,
          collectionAndFieldName);
      });
  };

  this.defineFields = function (Implementation, model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(Implementation, opts.integrations.layer,
      model)) {
        Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = function (Implementation, model, schema,
    dest, field) {
    if (integrationValid && field.integration === 'layer') {
      dest[field.field] = {
        ref: 'id',
        attributes: [],
        included: false,
        nullIfMissing: true,
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

