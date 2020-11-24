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
  _generateAuthenticationErrorMessage(error) {
    let errorMessageToForward;
    switch (error.message) {
      case this.errorMessages.SERVER_TRANSACTION.SECRET_AND_RENDERINGID_INCONSISTENT:
        errorMessageToForward = error.message;
        break;
      case this.errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND:
        errorMessageToForward = 'Cannot retrieve the project you\'re trying to unlock. '
            + 'Please check that you\'re using the right environment secret regarding your project and environment.';
        break;
      default: errorMessageToForward = undefined;
    }

    return errorMessageToForward;
  }

  /**
   * @param {number|string} renderingId
   * @param {string} environmentSecret
   * @param {string|null|undefined} twoFactorRegistration
   * @param {string} email
   * @param {string} password
   * @param {string} forestToken
   */
  async authenticate(
    renderingId,
    environmentSecret,
    twoFactorRegistration,
    email,
    password,
    forestToken,
  ) {
    let headers;

    if (email && password) {
      headers = { email, password };
    } else if (forestToken) {
      headers = { 'forest-token': forestToken };
    }

    let url = `/liana/v2/renderings/${renderingId}/authorization`;

    if (twoFactorRegistration) {
      url += `?two-factor-registration=${twoFactorRegistration}`;
    }

    try {
      const result = await this.forestServerRequester
        .perform(url, environmentSecret, null, headers);

      const user = result.data.attributes;
      user.id = result.data.id;
      return user;
    } catch (error) {
      this.logger.error('Authorization error: ', error);
      throw new Error(this._generateAuthenticationErrorMessage(error));
    }
  }
}

module.exports = AuthorizationFinder;
