/* eslint-disable global-require */
const createForestAdminClient = require('@forestadmin/forestadmin-client').default;

module.exports = (context) =>
  context
    .addInstance('logger', () => require('../services/logger'))
    .addUsingFunction('forestAdminClient', ({ env, logger }) => createForestAdminClient({
      forestServerUrl: env.FOREST_URL,
      envSecret: env.FOREST_ENV_SECRET,
      logger: (level, ...args) => (env.DEBUG ? logger[level.toLowerCase()](...args) : {}),
    }))
    .addInstance('chartHandler', ({ forestAdminClient }) => forestAdminClient.chartHandler)
    .addUsingClass('authorizationService', () => require('../services/authorization').default)
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
