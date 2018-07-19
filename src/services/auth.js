const error = require('./error');
const logger = require('./logger');
const createIpAuthorizer = require('../middlewares/ip-whitelist');
const compose = require('compose-middleware').compose;

const ERROR_MESSAGE = 'Forest cannot authenticate the user for this request.';

let ipAuthorizer;

function initAuth(options) {
  ipAuthorizer = createIpAuthorizer(options.envSecret);
}

function ensureAuthenticated(request, response, next) {
  if (request.user) {
    return next();
  } else {
    return next(new error.Unauthorized(ERROR_MESSAGE));
  }
}

function authenticate(request, response, next, authenticator) {
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

exports.allowedUsers = [];
exports.ensureAuthenticated = compose([
  ensureAuthenticated,
  function (request, response, next) {
    if (!ipAuthorizer) {
      return logger.error('"ensureAuthenticated" middleware must be called after "liana.init" function');
    }

    ipAuthorizer(request, response, next);
  }
]);
exports.authenticate = authenticate;
exports.initAuth = initAuth;
