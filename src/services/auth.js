const error = require('./error');
const logger = require('./logger');
const createIpAuthorizer = require('../middlewares/ip-whitelist');
const { createCheckPermission } = require('../middlewares/permissions');
const compose = require('compose-middleware').compose;

const ERROR_MESSAGE = 'Forest cannot authenticate the user for this request.';

let ipAuthorizer;
let envSecret;

function initAuth(options) {
  envSecret = options.envSecret;
  ipAuthorizer = createIpAuthorizer(envSecret);
}

function checkUser(request, response, next) {
  if (request.user) {
    return next();
  } else {
    return next(new error.Unauthorized(ERROR_MESSAGE));
  }
}

function checkIpAccess(request, response, next) {
  if (!ipAuthorizer) {
    return logger.error('"ensureAuthenticated" middleware must be called after "liana.init" function');
  }
  return ipAuthorizer(request, response, next);
}

function checkSmartActionPermission(request, response, next) {
  const modelName = request.body.data.attributes.collection_name;
  const smartActionName = request.originalUrl.substring(request.originalUrl.lastIndexOf('/') + 1, request.originalUrl.length);
  const { checkPermission } = createCheckPermission(envSecret, modelName, smartActionName);
  return checkPermission('execute')(request, response, next);
}

const ensureAuthenticated = compose([checkUser, checkIpAccess]);

const ensureAccess = compose([checkUser, checkIpAccess, checkSmartActionPermission]);

function lianaEnsureAuthenticated(request, response, next, authenticator) {
  if (request.user) {
    // NOTICE: User already authentified by the liana authentication middleware.
    return next();
  } else {
    if (!authenticator) {
      logger.error('The Liana has not been initialized to enable the authentication.');
      return next(new error.Unauthorized(ERROR_MESSAGE));
    }

    authenticator(request, response, function (hasError) {
      if (hasError) {
        logger.debug(hasError);
        return next(new error.Unauthorized(ERROR_MESSAGE));
      }

      return ensureAuthenticated(request, response, next);
    });
  }
}

function lianaEnsureAccess(request, response, next, authenticator) {
  if (request.user) {
    // NOTICE: User already authentified by the liana authentication middleware.
    return ensureAccess(request, response, next);
  } else {
    if (!authenticator) {
      logger.error('The Liana has not been initialized to enable the authentication.');
      return next(new error.Unauthorized(ERROR_MESSAGE));
    }

    authenticator(request, response, function (hasError) {
      if (hasError) {
        logger.debug(hasError);
        return next(new error.Unauthorized(ERROR_MESSAGE));
      }

      return ensureAuthenticated(request, response, next);
    });
  }
}

exports.allowedUsers = [];
exports.ensureAuthenticated = ensureAuthenticated;
exports.lianaEnsureAccess = lianaEnsureAccess;
exports.lianaEnsureAuthenticated = lianaEnsureAuthenticated;
exports.initAuth = initAuth;
