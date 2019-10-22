'use strict';
var _ = require('lodash');
var logger = require('../../services/logger');
var path = require('../../services/path');
var Routes = require('./routes');
var Setup = require('./setup');

function Checker(opts, Implementation) {
  var integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.layer;
  }

  function isProperlyIntegrated() {
    return opts.integrations.layer.serverApiToken &&
      opts.integrations.layer.appId;
  }

  function isMappingValid() {
    var models = Implementation.getModels();
    var mappingValid = true;
    _.map(opts.integrations.layer.mapping, function (mappingValue) {
      var collectionName = mappingValue.split('.')[0];
      if (!models[collectionName]) {
        mappingValid = false;
      }
    });

    if (!mappingValid) {
      logger.error('Cannot find some Layer integration mapping values (' +
        opts.integrations.layer.mapping + ') among the project models:\n' +
        _.keys(models).join(', '));
    }

    return mappingValid;
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
    if (isProperlyIntegrated()) {
      opts.integrations.layer.mapping =
        castToArray(opts.integrations.layer.mapping);
      integrationValid = isMappingValid();
    } else {
      logger.error('Cannot setup properly your Layer integration.');
    }
  }

  this.defineRoutes = function (app, model) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.layer, model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = function (collections) {
    if (!integrationValid) { return; }

    _.each(opts.integrations.layer.mapping,
      function (collectionAndFieldName) {
        Setup.createCollections(Implementation, collections,
          collectionAndFieldName);
      });
  };

  this.defineFields = function (model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.layer, model)) {
      Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = function (model, schema, dest, field) {
    if (integrationValid && field.integration === 'layer') {
      dest[field.field] = {
        ref: 'id',
        attributes: [],
        included: false,
        nullIfMissing: true,
        ignoreRelationshipData: true,
        relationshipLinks: {
          related: function (dataSet) {
            return {
              href: path.base() + Implementation.getModelName(model) +
                '/' + dataSet[schema.idField] + '/' + field.field,
            };
          }
        }
      };
    }
  };
}

module.exports = Checker;
