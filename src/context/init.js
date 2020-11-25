const fs = require('fs');
const superagentRequest = require('superagent');
const openIdClient = require('openid-client');
const jsonwebtoken = require('jsonwebtoken');

const errorMessages = require('../utils/error-messages');
const errorUtils = require('../utils/error');
const stringUtils = require('../utils/string');
const isSameDataStructure = require('../utils/is-same-data-structure');
const logger = require('../services/logger');
const pathService = require('../services/path');
const errorHandler = require('../services/exposed/error-handler');
const ipWhitelist = require('../services/ip-whitelist');
const forestServerRequester = require('../services/forest-server-requester');
const ApimapSorter = require('../services/apimap-sorter');
const ApimapSender = require('../services/apimap-sender');
const ApimapFieldsFormater = require('../services/apimap-fields-formater');
const AuthorizationFinder = require('../services/authorization-finder');
const SchemaFileUpdater = require('../services/schema-file-updater');
const HookLoad = require('../services/hook-load');
const schemasGenerator = require('../generators/schemas');

const AuthenticationService = require('../services/authentication');
const TokenService = require('../services/token');
const OidcConfigurationRetrieverService = require('../services/oidc-configuration-retriever');
const OidcClientManagerService = require('../services/oidc-client-manager');

function initValue(context) {
  context.addValue('forestUrl', process.env.FOREST_URL || 'https://api.forestadmin.com');
}

/**
 * @typedef {{
 *   NODE_ENV: 'production' | 'development';
 *   FOREST_DISABLE_AUTO_SCHEMA_APPLY: boolean;
 *   FOREST_2FA_SECRET_SALT?: boolean;
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
 *  isSameDataStructure: import('../utils/is-same-data-structure')
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
 *  hookLoad: import('../services/hook-load');
 *  schemasGenerator: import('../generators/schemas');
 *  authenticationService: import('../services/authentication');
 *  tokenService: import('../services/token');
 *  oidcConfigurationRetrieverService: import('../services/oidc-configuration-retriever');
 *  oidcClientManagerService: import('../services/oidc-client-manager')
 * }} Services
 *
 * @typedef {{
 *  superagentRequest: import('superagent');
 *  openIdClient: import('openid-client');
 *  jsonwebtoken: import('jsonwebtoken');
 * }} Externals
 *
 * @typedef {Externals & EnvPart & Utils & Services} Context
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
}

/**
 * @param {import('./application-context')} context
 */
function initServices(context) {
  context.addInstance('logger', logger);
  context.addInstance('pathService', pathService);
  context.addInstance('errorHandler', errorHandler);
  context.addInstance('ipWhitelist', ipWhitelist);
  context.addInstance('forestServerRequester', forestServerRequester);
  context.addInstance('schemasGenerator', schemasGenerator);
  context.addClass(ApimapFieldsFormater);
  context.addClass(AuthorizationFinder);
  context.addClass(ApimapSorter);
  context.addClass(ApimapSender);
  context.addClass(SchemaFileUpdater);
  context.addClass(HookLoad);
  context.addClass(TokenService);
  context.addClass(OidcConfigurationRetrieverService);
  context.addClass(OidcClientManagerService);
  context.addClass(AuthenticationService);
}

/**
 * @param {import('./application-context')} context
 */
function initExternals(context) {
  context.addInstance('superagentRequest', superagentRequest);
  context.addInstance('fs', fs);
  context.addInstance('openIdClient', openIdClient);
  context.addInstance('jsonwebtoken', jsonwebtoken);
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
