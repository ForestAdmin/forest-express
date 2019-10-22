'use strict';
var _ = require('lodash');
var logger = require('../../services/logger');
var path = require('../../services/path');
var Routes = require('./routes');
var Setup = require('./setup');

function Checker(opts, Implementation) {
  var integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.closeio &&
      opts.integrations.closeio.apiKey;
  }

  function isProperlyIntegrated() {
    return opts.integrations.closeio.apiKey &&
      opts.integrations.closeio.closeio && opts.integrations.closeio.mapping;
  }

  function isMappingValid() {
    var models = Implementation.getModels();
    var mappingValid = true;
    _.map(opts.integrations.closeio.mapping, function (mappingValue) {
      var collectionName = mappingValue.split('.')[0];
      if (!models[collectionName]) {
        mappingValid = false;
      }
    });

    if (!mappingValid) {
      logger.error('Cannot find some Close.io integration mapping values (' +
        opts.integrations.closeio.mapping + ') among the project models:\n' +
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
      opts.integrations.closeio.mapping =
        castToArray(opts.integrations.closeio.mapping);
      integrationValid = isMappingValid();
    } else {
      logger.error('Cannot setup properly your Close.io integration.');
    }
  }

  this.defineRoutes = function (app, model) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.closeio, model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = function (collections) {
    if (!integrationValid) { return; }

    _.each(opts.integrations.closeio.mapping,
      function (collectionAndFieldName) {
        Setup.createCollections(Implementation, collections,
          collectionAndFieldName);
      });
  };

  this.defineFields = function (model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.closeio, model)) {
      Setup.createFields(Implementation, model, schema);
    }
  };

  this.defineSerializationOption = function (model, schema, dest, field) {
    if (integrationValid && field.integration === 'close.io') {
      dest[field.field] = {
        ref: 'id',
        included: false,
        nullIfMissing: true, // TODO: This option in the JSONAPISerializer is weird.
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
