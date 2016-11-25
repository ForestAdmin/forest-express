'use strict';

exports.catchIfAny = function (error, request, response, next) {
  if (error) {
    // NOTICE: Send the first error if any
    var message = error.message;
    if (error && error.errors && error.errors[0] && error.errors[0].message) {
      message = error.errors[0].message;
    }

    response.status(error.status || 400).send({
      errors: [{
        status: error.status,
        detail: message
      }]
    });
  } else {
    next();
  }
};
