const logger = require('./logger');
const errorMessages = require('../utils/error-messages');
const P = require('bluebird');

function ServerResponseHandler(error, result) {
  this.perform = () => {
    return P.try(() => {
      if (result && result.status === 200 && result.body && result.body.data &&
        result.body.data.attributes) {
        return result.body.data;
      } else {
        if (result.status === 0) {
          logger.error(errorMessages.SERVER_TRANSACTION.SERVER_DOWN);
        } else if (result.status === 404) {
          logger.error(errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND);
        } else if (result.status === 422) {
          logger.error(errorMessages.SERVER_TRANSACTION.SECRET_AND_RENDERINGID_INCONSISTENT);
        } else {
          logger.error(errorMessages.SERVER_TRANSACTION.UNEXPECTED, error);
        }
        throw new Error(error);
      }
    });
  };
}

module.exports = ServerResponseHandler;
