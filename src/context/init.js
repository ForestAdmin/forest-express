const fs = require('fs');
const superagentRequest = require('superagent');
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

function initValue(context) {
  context.addValue('forestUrl', process.env.FOREST_URL || 'https://api.forestadmin.com');
}

/**
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
 *  apiMapSender: import('../services/apimap-sender');
 *  schemasGenerator: import('../generators/schemas');
 * }} Services
 *
 * @typedef {{
 *  superagentRequest: import('superagent');
 * }} Externals
 *
 * @typedef {Utils & Services & Externals} Context
 */

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
  context.addInstance('superagentRequest', superagentRequest);
  context.addInstance('writeFileSync', (...args) => fs.writeFileSync(...args));
  context.addInstance('schemasGenerator', schemasGenerator);
  context.addClass(ApimapFieldsFormater);
  context.addClass(AuthorizationFinder);
  context.addClass(ApimapSorter);
  context.addClass(ApimapSender);
  context.addClass(SchemaFileUpdater);
}

/**
 * @param {ApplicationContext} context
 */
function initExternals(context) {
  context.addInstance('superagentRequest', superagentRequest);
}

/**
 * @returns {ApplicationContext<Context>}
 */
function initContext() {
  /** @type {ApplicationContext<Context>} */
  const context = new ApplicationContext();

  initValue(context);
  initUtils(context);
  initServices(context);
  initExternals(context);

  return context;
}

module.exports = initContext;
