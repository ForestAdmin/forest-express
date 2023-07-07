/* eslint-disable global-require */
const createForestAdminClient = require('@forestadmin/forestadmin-client').default;

const loggerLevels = {
  Error: 0,
  Warn: 1,
  Info: 2,
  Debug: 3,
};

function makeLogger({ env, logger }) {
  return (level, ...args) => {
    const loggerLevel = env.FOREST_LOGGER_LEVEL ?? 'Info';

    if (loggerLevels[level] <= loggerLevels[loggerLevel]) {
      logger[level.toLowerCase()](...args);
    }
  };
}

module.exports.makeLogger = makeLogger;

module.exports.default = (context) =>
  context
    .addInstance('logger', () => require('../services/logger'))
    .addUsingFunction('forestAdminClient', ({ env, forestUrl, logger }) => createForestAdminClient({
      envSecret: env.FOREST_ENV_SECRET,
      forestServerUrl: forestUrl,
      logger: makeLogger({ env, logger }),
      instantCacheRefresh: false,
    }))
    .addInstance('chartHandler', ({ forestAdminClient }) => forestAdminClient.chartHandler)
    .addUsingClass('authorizationService', () => require('../services/authorization/authorization').default)
    .addUsingClass('actionAuthorizationService', () => require('../services/authorization/action-authorization').default)
    .addInstance('pathService', () => require('../services/path'))
    .addInstance('errorHandler', () => require('../services/exposed/error-handler'))
    .addInstance('ipWhitelist', () => require('../services/ip-whitelist'))
    .addInstance('forestServerRequester', () => require('../services/forest-server-requester'))
    .addInstance('schemasGenerator', () => require('../generators/schemas'))
    .addInstance('baseFilterParser', () => require('../services/base-filters-parser'))
    .addUsingClass('projectDirectoryFinder', () => require('../services/project-directory-finder'))
    .addUsingClass('configStore', () => require('../services/config-store'))
    .addUsingClass('apimapFieldsFormater', () => require('../services/apimap-fields-formater'))
    .addUsingClass('authorizationFinder', () => require('../services/authorization-finder'))
    .addUsingClass('apimapSorter', () => require('../services/apimap-sorter'))
    .addUsingClass('apimapSender', () => require('../services/apimap-sender'))
    .addUsingClass('schemaFileUpdater', () => require('../services/schema-file-updater'))
    .addUsingClass('scopeManager', () => require('../services/scope-manager'))
    .addUsingClass('modelsManager', () => require('../services/models-manager'))
    .addUsingClass('tokenService', () => require('../services/token'))
    .addUsingClass('oidcConfigurationRetrieverService', () => require('../services/oidc-configuration-retriever'))
    .addUsingClass('oidcClientManagerService', () => require('../services/oidc-client-manager'))
    .addUsingClass('authenticationService', () => require('../services/authentication'))
    .addUsingClass('smartActionFieldValidator', () => require('../services/smart-action-field-validator'))
    .addUsingClass('smartActionHookService', () => require('../services/smart-action-hook-service'))
    .addUsingClass('smartActionHookDeserializer', () => require('../deserializers/smart-action-hook'));
