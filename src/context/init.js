const fs = require('fs');
const moment = require('moment');
const VError = require('verror');

const superagentRequest = require('superagent');
const path = require('path');
const openIdClient = require('openid-client');
const jsonwebtoken = require('jsonwebtoken');

const errorMessages = require('../utils/error-messages');
const errorUtils = require('../utils/error');
const stringUtils = require('../utils/string');
const isSameDataStructure = require('../utils/is-same-data-structure');
const formatDefaultValue = require('../utils/format-default-value');
const joinUrl = require('../utils/join-url');
const { setFieldWidget } = require('../utils/widgets');
const logger = require('../services/logger');
const pathService = require('../services/path');
const errorHandler = require('../services/exposed/error-handler');
const ipWhitelist = require('../services/ip-whitelist');
const forestServerRequester = require('../services/forest-server-requester');
const ApimapSorter = require('../services/apimap-sorter');
const ApimapSender = require('../services/apimap-sender');
const ApimapFieldsFormater = require('../services/apimap-fields-formater');
const AuthorizationFinder = require('../services/authorization-finder');
const baseFilterParser = require('../services/base-filters-parser');
const ConfigStore = require('../services/config-store');
const PermissionsChecker = require('../services/permissions-checker');
const PermissionsGetter = require('../services/permissions-getter');
const permissionsFormatter = require('../services/permissions-formatter');
const SchemaFileUpdater = require('../services/schema-file-updater');
const SmartActionHook = require('../services/smart-action-hook');
const schemasGenerator = require('../generators/schemas');
const ModelsManager = require('../services/models-manager');
const AuthenticationService = require('../services/authentication');
const TokenService = require('../services/token');
const OidcConfigurationRetrieverService = require('../services/oidc-configuration-retriever');
const OidcClientManagerService = require('../services/oidc-client-manager');
const ProjectDirectoryFinder = require('../services/project-directory-finder');

function initValue(context) {
  context.addValue('forestUrl', process.env.FOREST_URL || 'https://api.forestadmin.com');
}

/**
 * @typedef {{
 *   NODE_ENV: 'production' | 'development';
 *   FOREST_DISABLE_AUTO_SCHEMA_APPLY: boolean;
 *   CORS_ORIGINS?: string;
 *   JWT_ALGORITHM: string;
 *   FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS: number;
 *   FOREST_OIDC_CONFIG_EXPIRATION_IN_SECONDS: number;
 *   FOREST_URL: string;
 *   APPLICATION_URL: string;
 *   FOREST_AUTH_SECRET: string;
 *   FOREST_ENV_SECRET: string;
 * }} Env
 *
 * @typedef {{
 *  env: Env
 * }} EnvPart
 *
 * @typedef {{
 *  errorMessages: import('../utils/error-messages');
 *  stringUtils: import('../utils/string');
 *  errorUtils: import('../utils/error');
 *  isSameDataStructure: import('../utils/object-have-same-keys')
 *  setFieldWidget: import('../utils/widgets').setFieldWidget
 *  joinUrl: import('../utils/join-url')
 * }} Utils
 *
 * @typedef {{
 *  logger: import('../services/logger');
 *  pathService: import('../services/path');
 *  errorHandler: import('../services/exposed/error-handler');
 *  ipWhitelist: import('../services/ip-whitelist');
 *  forestServerRequester: import('../services/forest-server-requester');
 *  authorizationFinder: import('../services/authorization-finder');
 *  schemaFileUpdater: import('../services/schema-file-updater');
 *  apimapSender: import('../services/apimap-sender');
 *  permissionsChecker: import('../services/permissions-checker');
 *  permissionsGetter: import('../services/permissions-getter');
 *  smartActionHook: import('../services/smart-action-hook');
 *  schemasGenerator: import('../generators/schemas');
 *  authenticationService: import('../services/authentication');
 *  tokenService: import('../services/token');
 *  oidcConfigurationRetrieverService: import('../services/oidc-configuration-retriever');
 *  oidcClientManagerService: import('../services/oidc-client-manager')
 *  configStore: import('../services/config-store')
 * }} Services
 *
 * @typedef {{
 *  superagentRequest: import('superagent');
 *  openIdClient: import('openid-client');
 *  jsonwebtoken: import('jsonwebtoken');
 * }} Externals
 *
 * @typedef {EnvPart & Utils & Services & Externals} Context
 */

/**
 * @param {import('./application-context')} context
 */
function initEnv(context) {
  context.addInstance('env', {
    ...process.env,
    FOREST_URL: process.env.FOREST_URL || 'https://api.forestadmin.com',
    JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
    NODE_ENV: ['dev', 'development'].includes(process.env.NODE_ENV)
      ? 'development'
      : 'production',
    APPLICATION_URL: process.env.APPLICATION_URL || `http://localhost:${process.env.APPLICATION_PORT || 3310}`,
  });
}

/**
 * @param {import('./application-context')} context
 */
function initUtils(context) {
  context.addInstance('errorMessages', errorMessages);
  context.addInstance('stringUtils', stringUtils);
  context.addInstance('errorUtils', errorUtils);
  context.addInstance('isSameDataStructure', isSameDataStructure);
  context.addInstance('formatDefaultValue', formatDefaultValue);
  context.addInstance('setFieldWidget', setFieldWidget);
  context.addInstance('joinUrl', joinUrl);
}

/**
 * @param {ApplicationContext} context
 */
function initServices(context) {
  context.addInstance('logger', logger);
  context.addInstance('pathService', pathService);
  context.addInstance('errorHandler', errorHandler);
  context.addInstance('ipWhitelist', ipWhitelist);
  context.addInstance('forestServerRequester', forestServerRequester);
  context.addInstance('schemasGenerator', schemasGenerator);
  context.addInstance('baseFilterParser', baseFilterParser);
  context.addInstance('permissionsFormatter', permissionsFormatter);
  context.addClass(ProjectDirectoryFinder);
  context.addClass(ConfigStore);
  context.addClass(PermissionsGetter);
  context.addClass(PermissionsChecker);
  context.addClass(ApimapFieldsFormater);
  context.addClass(AuthorizationFinder);
  context.addClass(ApimapSorter);
  context.addClass(ApimapSender);
  context.addClass(SchemaFileUpdater);
  context.addClass(ModelsManager);
  context.addClass(TokenService);
  context.addClass(OidcConfigurationRetrieverService);
  context.addClass(OidcClientManagerService);
  context.addClass(AuthenticationService);
  context.addClass(SmartActionHook);
}

/**
 * @param {import('./application-context')} context
 */
function initExternals(context) {
  context.addInstance('superagentRequest', superagentRequest);
  context.addInstance('fs', fs);
  context.addInstance('path', path);
  context.addInstance('openIdClient', openIdClient);
  context.addInstance('jsonwebtoken', jsonwebtoken);
  context.addInstance('moment', moment);
  context.addInstance('VError', VError);
}

/**
 * @param {import('./application-context')<Context>} context
 */
function initContext(context) {
  initExternals(context);
  initValue(context);
  initEnv(context);
  initUtils(context);
  initServices(context);
}

module.exports = initContext;
