'use strict';
var logger = require('./logger');

exports.catchIfAny = function (error, request, response, next) {
  if (error) {
    // NOTICE: Send the first error if any
    var message = error.message;
    if (error && error.errors && error.errors[0] && error.errors[0].message) {
      message = error.errors[0].message;
    }

    if (!error.status) {
      // NOTICE: Unexpected errors should log an error in the console.
      logger.error('Unexpected error: ' + message, error);
    }
    response.status(error.status || 500).send({
      errors: [{
        status: error.status || 500,
        detail: message
      }]
    });
  } else {
    next();
  }
};
