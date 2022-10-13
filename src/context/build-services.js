/* eslint-disable global-require */
const createForestAdminClient = require('@forestadmin/forestadmin-client').default;

module.exports = (context) =>
  context
    .addInstance('logger', () => require('../services/logger'))
    .addUsingFunction('forestAdminClient', ({ env, logger }) => createForestAdminClient({
      forestServerUrl: env.FOREST_URL,
      envSecret: env.FOREST_ENV_SECRET,
      logger: (level, ...args) => logger[level.toLowerCase()](...args),
    }))
    .addUsingClass('authorizationService', () => require('../services/authorization').default)
    .addInstance('pathService', () => require('../services/path'))
    .addInstance('errorHandler', () => require('../services/exposed/error-handler'))
    .addInstance('ipWhitelist', () => require('../services/ip-whitelist')) // Could be handle by ForestAdminClient
    .addInstance('forestServerRequester', () => require('../services/forest-server-requester')) // Could be handle by ForestAdminClient
    .addInstance('schemasGenerator', () => require('../generators/schemas'))
    .addInstance('baseFilterParser', () => require('../services/base-filters-parser'))
    .addUsingClass('projectDirectoryFinder', () => require('../services/project-directory-finder'))
    .addUsingClass('configStore', () => require('../services/config-store'))
    .addUsingClass('apimapFieldsFormater', () => require('../services/apimap-fields-formater'))
    .addUsingClass('authorizationFinder', () => require('../services/authorization-finder')) // Could be handle by ForestAdminClient
    .addUsingClass('apimapSorter', () => require('../services/apimap-sorter')) // Could be handle by ForestAdminClient
    .addUsingClass('apimapSender', () => require('../services/apimap-sender')) // Could be handle by ForestAdminClient
    .addUsingClass('schemaFileUpdater', () => require('../services/schema-file-updater'))
    .addUsingClass('scopeManager', () => require('../services/scope-manager')) // Will be handle by ForestAdminClient
    .addUsingClass('modelsManager', () => require('../services/models-manager'))
    .addUsingClass('tokenService', () => require('../services/token')) // Could be handle by ForestAdminClient
    .addUsingClass('oidcConfigurationRetrieverService', () => require('../services/oidc-configuration-retriever')) // Could be handle by ForestAdminClient
    .addUsingClass('oidcClientManagerService', () => require('../services/oidc-client-manager')) // Could be handle by ForestAdminClient
    .addUsingClass('authenticationService', () => require('../services/authentication')) // Could be handle by ForestAdminClient
    .addUsingClass('smartActionFieldValidator', () => require('../services/smart-action-field-validator'))
    .addUsingClass('smartActionHookService', () => require('../services/smart-action-hook-service'))
    .addUsingClass('smartActionHookDeserializer', () => require('../deserializers/smart-action-hook'));
