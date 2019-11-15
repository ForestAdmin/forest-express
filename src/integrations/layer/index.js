
const _ = require('lodash');
const logger = require('../../services/logger');
const Routes = require('./routes');
const Setup = require('./setup');

function Checker(opts, Implementation) {
  let integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.layer;
  }

  function isProperlyIntegrated() {
    return opts.integrations.layer.serverApiToken &&
      opts.integrations.layer.appId;
  }

  function isMappingValid() {
    const models = Implementation.getModels();
    let mappingValid = true;
    _.map(opts.integrations.layer.mapping, (mappingValue) => {
      const collectionName = mappingValue.split('.')[0];
      if (!models[collectionName]) {
        mappingValid = false;
      }
    });

    if (!mappingValid) {
      logger.error(`Cannot find some Layer integration mapping values (${
        opts.integrations.layer.mapping}) among the project models:\n${
        _.keys(models).join(', ')}`);
    }

    return mappingValid;
  }

  function castToArray(value) {
    return _.isString(value) ? [value] : value;
  }

  function integrationCollectionMatch(integration, model) {
    if (!integrationValid) { return; }

    const models = Implementation.getModels();

    const collectionModelNames = _.map(
      integration.mapping,
      (mappingValue) => {
        const collectionName = mappingValue.split('.')[0];
        if (models[collectionName]) {
          return Implementation.getModelName(models[collectionName]);
        }
      },
    );

    return collectionModelNames.indexOf(Implementation.getModelName(model)) > -1;
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

    _.each(
      opts.integrations.layer.mapping,
      (collectionAndFieldName) => {
        Setup.createCollections(
          Implementation, collections,
          collectionAndFieldName,
        );
      },
    );
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
          related(dataSet) {
            return {
              href: `/forest/${Implementation.getModelName(model)
              }/${dataSet[schema.idField]}/${field.field}`,
            };
          },
        },
      };
    }
  };
}

module.exports = Checker;
