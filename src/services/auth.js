const error = require('./error');
const logger = require('./logger');
const createIpAuthorizer = require('../middlewares/ip-whitelist');
const { compose } = require('compose-middleware');

const ERROR_MESSAGE = 'Forest cannot authenticate the user for this request.';
const ERROR_MESSAGE_TOKEN_OLD = 'Your token format is invalid, please login again.';

let ipAuthorizer;

function initAuth(options) {
  ipAuthorizer = createIpAuthorizer(options.envSecret);
}

function ensureAuthenticated(request, response, next) {
  if (!request.user) {
    return next(new error.Unauthorized(ERROR_MESSAGE));
  }

  // NOTICE: Automatically logout users trying to access the API with a token having an
  //         old data format.
  if (request.user.type) {
    return next(new error.Unauthorized(ERROR_MESSAGE_TOKEN_OLD));
  }

  return next();
}

function authenticate(request, response, next, authenticator) {
  if (request.user) {
    // NOTICE: User already authentified by the liana authentication middleware.
    return next();
  }

  if (!authenticator) {
    logger.error('The Liana has not been initialized to enable the authentication.');
    return next(new error.Unauthorized(ERROR_MESSAGE));
  }

  return authenticator(request, response, (hasError) => {
    if (hasError) {
      logger.debug(hasError);
      return next(new error.Unauthorized(ERROR_MESSAGE));
    }

    return ensureAuthenticated(request, response, next);
  });
}

exports.allowedUsers = [];
exports.ensureAuthenticated = compose([
  ensureAuthenticated,
  (request, response, next) => {
    if (!ipAuthorizer) {
      return logger.error('"ensureAuthenticated" middleware must be called after "liana.init" function');
    }

    return ipAuthorizer(request, response, next);
  },
]);
exports.authenticate = authenticate;
exports.initAuth = initAuth;
