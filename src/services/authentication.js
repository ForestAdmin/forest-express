
class AuthenticationService {
  /** @private @readonly @type {import('openid-client')} */
  openIdClient;

  /** @private @readonly @type {import('./authorization-finder')} */
  authorizationFinder;

  /** @private @readonly @type {import('./token')} */
  tokenService;

  /** @private @readonly @type {import('./oidc-configuration-retriever')} */
  oidcConfigurationRetrieverService;

  /** @private @readonly @type {import('../utils/error-messages')} */
  errorMessages;

  /**
   * @param {import("../context/init").Context} context
   */
  constructor({
    openIdClient, authorizationFinder, tokenService,
    errorMessages, oidcConfigurationRetrieverService,
  }) {
    this.openIdClient = openIdClient;
    this.authorizationFinder = authorizationFinder;
    this.tokenService = tokenService;
    this.oidcConfigurationRetrieverService = oidcConfigurationRetrieverService;
    this.errorMessages = errorMessages;
  }

  /**
   * @private
   * @param {string} redirectUrl
   * @returns {Promise<import('openid-client').Client>}
   */
  async _createClient(redirectUrl) {
    const configuration = await this.oidcConfigurationRetrieverService.retrieve();
    const issuer = new this.openIdClient.Issuer(configuration);

    return new issuer.Client({
      client_id: 'forest-express-temporary-fixed-id',
      redirect_uris: [redirectUrl],
      token_endpoint_auth_method: 'none',
    });
  }

  /**
   * @private
   * @param {string} state
   * @returns {{renderingId: string}}
   */
  _parseState(state) {
    if (!state) {
      throw new Error(this.errorMessages.SERVER_TRANSACTION.INVALID_STATE_MISSING);
    }

    /** @type {string} */
    let renderingId;

    try {
      const parsedState = JSON.parse(state);
      renderingId = parsedState.renderingId;
    } catch (e) {
      throw new Error(this.errorMessages.SERVER_TRANSACTION.INVALID_STATE_FORMAT);
    }

    if (!renderingId) {
      throw new Error(this.errorMessages.SERVER_TRANSACTION.INVALID_STATE_RENDERING_ID);
    }

    return { renderingId };
  }

  /**
   * Step 1 of the authentication
   * @param {string} redirectUrl
   * @param {{renderingId: string|number}} state
   * @returns {Promise<{
   *  authorizationUrl: string;
   * }>}
   */
  async startAuthentication(redirectUrl, state) {
    const client = await this._createClient(redirectUrl);

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid email profile',
      state: JSON.stringify(state),
    });

    return { authorizationUrl };
  }

  /**
   * @param {string} redirectUrl
   * @param {import('openid-client').CallbackParamsType} params
   * @param {{ envSecret: string, authSecret: string }} options
   */
  async verifyCodeAndGenerateToken(redirectUrl, params, options) {
    const client = await this._createClient(redirectUrl);

    const { renderingId } = this._parseState(params.state);

    const tokenSet = await client.callback(
      redirectUrl,
      params,
      { state: params.state },
    );

    const user = await this.authorizationFinder.authenticate(
      renderingId,
      options.envSecret,
      null,
      null,
      null,
      tokenSet.access_token,
    );

    return this.tokenService.createToken(user, renderingId, options);
  }
}


module.exports = AuthenticationService;
