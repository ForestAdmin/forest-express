'use strict';
var _ = require('lodash');
var logger = require('../../services/logger');
var Routes = require('./routes');
var Setup = require('./setup');

function Checker(opts) {
  var integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.closeio &&
      opts.integrations.closeio.apiKey;
  }

  function isProperlyIntegrated() {
    return opts.integrations.closeio.apiKey &&
      opts.integrations.closeio.closeio && opts.integrations.closeio.mapping;
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

  if (hasIntegration()) {
    if (isProperlyIntegrated()) {
      opts.integrations.closeio.mapping =
        castToArray(opts.integrations.closeio.mapping);
      integrationValid = true;
    } else {
      logger.error('Cannot setup properly your Close.io integration.');
    }
  }

  this.defineRoutes = function (app, model, Implementation) {
    if (!integrationValid) { return; }

    new Routes(app, model, Implementation, opts).perform();
  };

  this.defineCollections = function (Implementation, collections) {
    if (!integrationValid) { return; }

    _.each(opts.integrations.closeio.mapping,
      function (collectionAndFieldName) {
        Setup.createCollections(Implementation, collections,
          collectionAndFieldName);
      });
  };

  this.defineFields = function (Implementation, model, schema) {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(Implementation, opts.integrations.closeio,
      model)) {
        Setup.createFields(Implementation, model, schema);
    }
  };

  this.defineSerializationOption = function (Implementation, model, schema,
    dest, field) {

    if (integrationValid && field.integration === 'close.io') {
      dest[field.field] = {
        ref: 'id',
        included: false,
        ignoreRelationshipData: true,
        nullIfMissing: true,
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
