const _ = require('lodash');
const logger = require('../../services/logger');
const Routes = require('./routes');
const Setup = require('./setup');

function Checker(opts, Implementation) {
  let integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.closeio && opts.integrations.closeio.apiKey;
  }

  function isProperlyIntegrated() {
    return opts.integrations.closeio.apiKey && opts.integrations.closeio.closeio
      && opts.integrations.closeio.mapping;
  }

  function isMappingValid() {
    const models = Implementation.getModels();
    let mappingValid = true;
    _.map(opts.integrations.closeio.mapping, (mappingValue) => {
      const collectionName = mappingValue.split('.')[0];
      if (!models[collectionName]) {
        mappingValid = false;
      }
    });

    if (!mappingValid) {
      logger.error(`Cannot find some Close.io integration mapping values (${
        opts.integrations.closeio.mapping}) among the project models:\n${
        _.keys(models).join(', ')}`);
    }

    return mappingValid;
  }

  function castToArray(value) {
    return _.isString(value) ? [value] : value;
  }

  function integrationCollectionMatch(integration, model) {
    if (!integrationValid) { return false; }

    const models = Implementation.getModels();

    const collectionModelNames = _.map(
      integration.mapping,
      (mappingValue) => {
        const collectionName = mappingValue.split('.')[0];
        if (models[collectionName]) {
          return Implementation.getModelName(models[collectionName]);
        }
        return null;
      },
    );

    return collectionModelNames.indexOf(Implementation.getModelName(model)) > -1;
  }

  if (hasIntegration()) {
    if (isProperlyIntegrated()) {
      opts.integrations.closeio.mapping = castToArray(opts.integrations.closeio.mapping);
      integrationValid = isMappingValid();
    } else {
      logger.error('Cannot setup properly your Close.io integration.');
    }
  }

  this.defineRoutes = (app, model) => {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.closeio, model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = (collections) => {
    if (!integrationValid) { return; }

    _.each(
      opts.integrations.closeio.mapping,
      (collectionAndFieldName) => {
        Setup.createCollections(
          Implementation, collections,
          collectionAndFieldName,
        );
      },
    );
  };

  this.defineFields = (model, schema) => {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.closeio, model)) {
      Setup.createFields(Implementation, model, schema);
    }
  };

  this.defineSerializationOption = (model, schema, dest, field) => {
    if (integrationValid && field.integration === 'close.io') {
      dest[field.field] = {
        ref: 'id',
        included: false,
        nullIfMissing: true, // TODO: This option in the JSONAPISerializer is weird.
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
