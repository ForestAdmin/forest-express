const logger = require('../logger');

exports.catchIfAny = (error, request, response, next) => {
  if (error) {
    // NOTICE: Send the first error if any
    if (error && error.errors && error.errors[0] && error.errors[0].message) {
      error.message = error.errors[0].message;
    }

    if (!error.status) {
      // NOTICE: Unexpected errors should log an error in the console.
      logger.error('Unexpected error: ', error);
    }
    response.status(error.status || 500).send({
      errors: [{
        status: error.status || 500,
        detail: error.message,
      }],
    });
  } else {
    next();
  }
};
