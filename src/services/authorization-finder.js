const InconsistentSecretAndRenderingError = require('../utils/errors/authentication/inconsistent-secret-rendering-error');
const SecretNotFoundError = require('../utils/errors/authentication/secret-not-found-error');
const TwoFactorAuthenticationRequiredError = require('../utils/errors/authentication/two-factor-authentication-required-error');
const AuthorizationError = require('../utils/errors/authentication/authorization-error');

class AuthorizationFinder {
  /** @private @readonly @type {import('./forest-server-requester')} */
  forestServerRequester;

  /** @private @readonly @type {import('./logger')} */
  logger;

  /** @private @readonly @type {import('../utils/error-messages')} */
  errorMessages;

  /**
   * @param {import('../context/init').Context} context
   */
  constructor(context) {
    this.forestServerRequester = context.forestServerRequester;
    this.logger = context.logger;
    this.errorMessages = context.errorMessages;
  }

  /**
   * @private
   * @param {Error} error
   * @returns {string}
   */
  _generateAuthenticationError(error) {
    switch (error.message) {
      case this.errorMessages.SERVER_TRANSACTION.SECRET_AND_RENDERINGID_INCONSISTENT:
        return new InconsistentSecretAndRenderingError();
      case this.errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND:
        return new SecretNotFoundError();
      default:
    }

    // eslint-disable-next-line camelcase
    const serverErrors = error?.jse_cause?.response?.body?.errors;
    const serverError = serverErrors && serverErrors[0];

    if (serverError?.name === this.errorMessages
      .SERVER_TRANSACTION
      .names
      .TWO_FACTOR_AUTHENTICATION_REQUIRED) {
      return new TwoFactorAuthenticationRequiredError();
    }

    if (serverError?.status) {
      throw new AuthorizationError(
        serverError.status,
        serverError.detail,
      );
    }

    return new Error();
  }

  /**
   * @param {number|string} renderingId
   * @param {string} environmentSecret
   * @param {string} forestToken
   */
  async authenticate(
    renderingId,
    environmentSecret,
    forestToken,
  ) {
    const headers = { 'forest-token': forestToken };

    const url = `/liana/v2/renderings/${renderingId}/authorization`;

    try {
      const result = await this.forestServerRequester
        .perform(url, environmentSecret, null, headers);

      const user = result.data.attributes;
      user.id = result.data.id;
      return user;
    } catch (error) {
      // eslint-disable-next-line camelcase
      this.logger.error('Authorization error: ', error?.jse_cause?.response.body || error);
      throw this._generateAuthenticationError(error);
    }
  }
}

module.exports = AuthorizationFinder;
