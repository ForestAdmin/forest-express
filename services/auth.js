'use strict';
var error = require('./error');
var logger = require('./logger');

var ERROR_MESSAGE = 'Forest cannot authenticate the user for this request.';

function ensureAuthenticated(request, response, next) {
  if (request.user) {
    return next();
  } else {
    return next(new error.Unauthorized(ERROR_MESSAGE));
  }
}

function authentify(request, response, next, authenticator) {
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
exports.ensureAuthenticated = ensureAuthenticated;
exports.authentify = authentify;
