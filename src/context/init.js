const openIdClient = require('openid-client');
const jsonwebtoken = require('jsonwebtoken');

const ApplicationContext = require('./application-context');

const errorMessages = require('../utils/error-messages');
const logger = require('../services/logger');
const pathService = require('../services/path');
const errorHandler = require('../services/exposed/error-handler');
const ipWhitelist = require('../services/ip-whitelist');
const forestServerRequester = require('../services/forest-server-requester');
const AuthorizationFinder = require('../services/authorization-finder');
const AuthenticationService = require('../services/authentication');
const RequestAnalyzerService = require('../services/request-analyser');
const TokenService = require('../services/token');
const OidcConfigurationRetrieverService = require('../services/oidc-configuration-retriever');
const OidcClientManagerService = require('../services/oidc-client-manager');

/**
 * @typedef {{
 *  openIdClient: import('openid-client');
 *  jsonwebtoken: import('jsonwebtoken');
 * }} Dependencies
 *
 * @typedef {{
 *   NODE_ENV: 'production' | 'development';
 *   FOREST_DISABLE_AUTO_SCHEMA_APPLY: boolean;
 *   FOREST_2FA_SECRET_SALT?: boolean;
 *   CORS_ORIGINS?: string;
 *   JWT_ALGORITHM: string;
 *   FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS: number;
 *   FOREST_OIDC_CONFIG_EXPIRATION_IN_SECONDS: number;
 *   FOREST_URL: string;
 * }} Env
 *
 * @typedef {{
 *  env: Env
 * }} EnvPart
 *
 * @typedef {{
 *  errorMessages: import('../utils/error-messages');
 * }} Utils
 *
 * @typedef {{
 *  logger: import('../services/logger');
 *  pathService: import('../services/path');
 *  errorHandler: import('../services/exposed/error-handler');
 *  ipWhitelist: import('../services/ip-whitelist');
 *  forestServerRequester: import('../services/forest-server-requester');
 *  authorizationFinder: import('../services/authorization-finder');
 *  authenticationService: import('../services/authentication');
 *  requestAnalyzerService: import('../services/request-analyser');
 *  tokenService: import('../services/token');
 *  oidcConfigurationRetrieverService: import('../services/oidc-configuration-retriever');
 *  oidcClientManagerService: import('../services/oidc-client-manager')
 * }} Services
 *
 * @typedef {Dependencies & EnvPart & Utils & Services} Context
 */

/**
 * @param {ApplicationContext} context
 */
function initEnv(context) {
  context.addInstance('env', {
    ...process.env,
    FOREST_URL: process.env.FOREST_URL || 'https://app.forestadmin.com',
    JWT_ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
    NODE_ENV: ['dev', 'development'].includes(process.env.NODE_ENV)
      ? 'development'
      : 'production',
  });
}

/**
 * @param {ApplicationContext} context
 */
function initDependencies(context) {
  context.addInstance('openIdClient', openIdClient);
  context.addInstance('jsonwebtoken', jsonwebtoken);
}

/**
 * @param {ApplicationContext} context
 */
function initUtils(context) {
  context.addInstance('errorMessages', errorMessages);
}

/**
 * @param {ApplicationContext} context
 */
function initServices(context) {
  context.addInstance('logger', logger);
  context.addInstance('pathService', pathService);
  context.addInstance('errorHandler', errorHandler);
  context.addInstance('ipWhitelist', ipWhitelist);
  context.addClass(RequestAnalyzerService);
  context.addInstance('forestServerRequester', forestServerRequester);
  context.addClass(AuthorizationFinder);
  context.addClass(TokenService);
  context.addClass(OidcConfigurationRetrieverService);
  context.addClass(OidcClientManagerService);
  context.addClass(AuthenticationService);
}

/**
 * @returns {ApplicationContext<Context>}
 */
function initContext() {
  /** @type {ApplicationContext<Context>} */
  const context = new ApplicationContext();

  initEnv(context);
  initDependencies(context);
  initUtils(context);
  initServices(context);

  return context;
}

module.exports = initContext;
