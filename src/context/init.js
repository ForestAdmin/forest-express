const fs = require('fs');
const superagentRequest = require('superagent');
const path = require('path');
const openIdClient = require('openid-client');

const ApplicationContext = require('./application-context');

const errorMessages = require('../utils/error-messages');
const errorUtils = require('../utils/error');
const stringUtils = require('../utils/string');
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
const schemasGenerator = require('../generators/schemas');
const ConfigStore = require('../services/config-store');
const ModelsManager = require('../services/models-manager');
const AuthenticationService = require('../services/authentication');
const RequestAnalyzerService = require('../services/request-analyser');

function initValue(context) {
  context.addValue('forestUrl', process.env.FOREST_URL || 'https://api.forestadmin.com');
}

/**
 * @typedef {{
 *  env: {
 *    NODE_ENV: 'production' | 'development';
 *    FOREST_DISABLE_AUTO_SCHEMA_APPLY: boolean;
 *    FOREST_2FA_SECRET_SALT?: boolean;
 *    CORS_ORIGINS?: string;
 *    JWT_ALGORITHM: string;
 *    FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS: number;
 *    FOREST_URL: string;
 *  }
 * }} Env
 *
 * @typedef {{
 *  errorMessages: import('../utils/error-messages');
 *  stringUtils: import('../utils/string');
 *  errorUtils: import('../utils/error');
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
 *  schemasGenerator: import('../generators/schemas');
 *  authenticationService: import('../services/authentication');
 *  requestAnalyzerService: import('../services/request-analyser');
 * }} Services
 *
 * @typedef {{
 *  superagentRequest: import('superagent');
 *  openIdClient: import('openid-client');
 * }} Externals
 *
 * @typedef {Utils & Services & Externals} Context
 *
 * @typedef {Env & Utils & Services & Externals} Context
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
function initUtils(context) {
  context.addInstance('errorMessages', errorMessages);
  context.addInstance('stringUtils', stringUtils);
  context.addInstance('errorUtils', errorUtils);
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
  context.addClass(ApimapFieldsFormater);
  context.addClass(AuthorizationFinder);
  context.addClass(ApimapSorter);
  context.addClass(ApimapSender);
  context.addClass(SchemaFileUpdater);
  context.addClass(ConfigStore);
  context.addClass(ModelsManager);
  context.addClass(RequestAnalyzerService);
  context.addClass(AuthenticationService);
}

/**
 * @param {ApplicationContext} context
 */
function initExternals(context) {
  context.addInstance('superagentRequest', superagentRequest);
  context.addInstance('fs', fs);
  context.addInstance('path', path);
  context.addInstance('openIdClient', openIdClient);
}

/**
 * @param {ApplicationContext<Context>} context
 */
function initContext(context) {
  initExternals(context);
  initValue(context);
  initEnv(context);
  initUtils(context);
  initServices(context);
}

module.exports = initContext;
