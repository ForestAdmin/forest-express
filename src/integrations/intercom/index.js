const _ = require('lodash');
const logger = require('../../services/logger');
const Routes = require('./routes');
const Setup = require('./setup');

function IntercomChecker(opts, Implementation) {
  let integrationValid = false;

  function hasIntegration() {
    return opts.integrations && opts.integrations.intercom;
  }

  function isProperlyIntegrated() {
    return opts.integrations.intercom.accessToken
      && opts.integrations.intercom.intercom && opts.integrations.intercom.mapping;
  }

  function isMappingValid() {
    const models = Implementation.getModels();
    let mappingValid = true;
    _.map(opts.integrations.intercom.mapping, (mappingValue) => {
      const collectionName = mappingValue.split('.')[0];
      if (!models[collectionName]) {
        mappingValid = false;
      }
    });

    if (!mappingValid) {
      logger.error(`Cannot find some Intercom integration mapping values (${
        opts.integrations.intercom.mapping}) among the project models:\n${
        _.keys(models).join(', ')}`);
    }

    return mappingValid;
  }

  function isIntegrationDeprecated() {
    const isIntegrationValid = opts.integrations.intercom.apiKey
      && opts.integrations.intercom.appId
      && opts.integrations.intercom.intercom
      && opts.integrations.intercom.mapping;

    if (isIntegrationValid) {
      logger.warn('Intercom integration attributes "apiKey" and "appId" are now deprecated, please use "accessToken" attribute.');
    }

    return isIntegrationValid;
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
    if (isProperlyIntegrated() || isIntegrationDeprecated()) {
      opts.integrations.intercom.mapping = castToArray(opts.integrations.intercom.mapping);

      if (opts.integrations.intercom.accessToken) {
        opts.integrations.intercom.credentials = {
          token: opts.integrations.intercom.accessToken,
        };
      }

      integrationValid = isMappingValid();
    } else {
      logger.error('Cannot setup properly your Intercom integration.');
    }
  }

  this.defineRoutes = (app, model) => {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.intercom, model)) {
      new Routes(app, model, Implementation, opts).perform();
    }
  };

  this.defineCollections = (collections) => {
    if (!integrationValid) { return; }

    _.each(
      opts.integrations.intercom.mapping,
      (collectionName) => {
        Setup.createCollections(Implementation, collections, collectionName);
      },
    );
  };

  this.defineFields = (model, schema) => {
    if (!integrationValid) { return; }

    if (integrationCollectionMatch(opts.integrations.intercom, model)) {
      Setup.createFields(Implementation, model, schema.fields);
    }
  };

  this.defineSerializationOption = (model, schema, dest, field) => {
    if (integrationValid && field.integration === 'intercom') {
      dest[field.field] = {
        ref: 'id',
        attributes: [],
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

module.exports = IntercomChecker;
