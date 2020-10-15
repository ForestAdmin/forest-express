const ApplicationContext = require('./application-context');

const errorMessages = require('../utils/error-messages');
const logger = require('../services/logger');
const pathService = require('../services/path');
const errorHandler = require('../services/exposed/error-handler');
const ipWhitelist = require('../services/ip-whitelist');

/**
 * @typedef {{
 *  errorMessages: import('../utils/error-messages');
 * }} Utils
 *
 * @typedef {{
 *  logger: import('../services/logger');
 *  pathService: import('../services/path');
 *  errorHandler: import('../services/exposed/error-handler');
 *  ipWhitelist: import('../services/ip-whitelist');
 * }} Services
 *
 * @typedef {Utils & Services} Context
 */

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
}

/**
 * @returns {ApplicationContext<Context>}
 */
function initContext() {
  /** @type {ApplicationContext<Context>} */
  const context = new ApplicationContext();

  initUtils(context);
  initServices(context);

  return context;
}

module.exports = initContext;
