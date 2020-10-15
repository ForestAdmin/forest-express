const _ = require('lodash');
const AuthenticationService = require('../services/authentication');
const logger = require('../services/logger');
const pathService = require('../services/path');
const errorMessages = require('./error-messages');


/**
 * @typedef {{
 *  errorMessages: import('./error-messages');
 * }} Utils
 * @typedef {{
 *  logger: import('../services/logger');
 *  pathService: import('../services/path');
 *  authenticationService: import('../services/authentication');
 * }} Services
 * @typedef {Utils & Services} Injections
 */

/**
 * @template TInjections
 * @template TInstance
 * @param {TInjections} injections
 * @param {function(new:TInstance, TInjections)} Dependency
 * @returns { TInjections & {[name]: TInstance}}
 */
function addFromClass(injections, Dependency) {
  return {
    ...injections,

    [_.lowerFirst(Dependency.getClassName())]: new Dependency(injections),
  };
}

/**
 * @template TInjections
 * @template TInstance
 * @param {TInjections} injections
 * @param {string} name
 * @param {TInstance} instance
 * @returns { TInjections & {[name]: TInstance}}
 */
function addInstance(injections, name, instance) {
  return {
    ...injections,
    [name]: instance,
  };
}

/**
 * @function
 * @template T
 * @param {T} injections
 * @returns {T & Utils}
 */
function buildUtils(injections) {
  /** @type {*} */
  let result = injections;

  result = addInstance(result, 'errorMessages', errorMessages);

  return result;
}
/**
 * @template T
 * @param {T & Utils} injections
 * @returns {T & Utils & Services}
*/
function buildServices(injections) {
  /** @type {*} */
  let result = injections;

  result = addInstance(result, 'logger', logger);
  result = addInstance(result, 'pathService', pathService);
  result = addFromClass(result, AuthenticationService);

  return result;
}

/**
 * @returns { Injections }
 */
function init() {
  return [
    buildUtils,
    buildServices,
  ].reduce((injections, builder) => builder(injections), {});
}


module.exports = init;
