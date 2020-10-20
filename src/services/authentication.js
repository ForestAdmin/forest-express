
class AuthenticationService {
  /** @private @readonly @type {import('openid-client')} */
  openIdClient;

  /** @private @readonly @type {import('./authorization-finder')} */
  authorizationFinder;

  /** @private @readonly @type {import('./token')} */
  tokenService;

  /** @private @readonly @type {import('../utils/error-messages')} */
  errorMessages;

  /** @private @readonly @type {import('../context/init').Env} */
  env;

  /**
   * @param {import("../context/init").Context} context
   */
  constructor({
    openIdClient, env, authorizationFinder, tokenService,
    errorMessages,
  }) {
    this.openIdClient = openIdClient;
    this.authorizationFinder = authorizationFinder;
    this.tokenService = tokenService;
    this.errorMessages = errorMessages;
    this.env = env;
  }

  /**
   * @private
   * @param {string} redirectUrl
   * @returns {import('openid-client').Client}
   */
  _createClient(redirectUrl) {
    const issuer = new this.openIdClient.Issuer({
      issuer: 'forestadmin-server',
      authorization_endpoint: `${this.env.FOREST_URL}/oidc/authorization`,
      token_endpoint: `${this.env.FOREST_URL}/oidc/token`,
      end_session_endpoint: `${this.env.FOREST_URL}/oidc/logout`,
      jwks_uri: `${this.env.FOREST_URL}/oidc/jwks`,
    });

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
   * @returns {{
   *  authorizationUrl: string;
   * }}
   */
  startAuthentication(redirectUrl, state) {
    const client = this._createClient(redirectUrl);

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
    const client = this._createClient(redirectUrl);

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
