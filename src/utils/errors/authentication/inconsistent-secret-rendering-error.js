const errorMessages = require('../../error-messages');

class InconsistentSecretAndRenderingError extends Error {
  constructor() {
    super(errorMessages.SERVER_TRANSACTION.SECRET_AND_RENDERINGID_INCONSISTENT);
    this.name = this.constructor.name;
    this.status = 500;
  }
}

module.exports = InconsistentSecretAndRenderingError;
