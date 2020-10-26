class AuthenticationService {
  /** @private @readonly @type {import('openid-client')} */
  openIdClient;

  /** @private @readonly @type {import('openid-client').Issuer} */
  issuer;

  /**
   * @param {import("../context/init").Context} context
   */
  constructor({ openIdClient, env }) {
    this.openIdClient = openIdClient;
    this.issuer = new openIdClient.Issuer({
      issuer: 'forestadmin-server',
      authorization_endpoint: `${env.FOREST_URL}/oidc/authorization`,
      token_endpoint: `${env.FOREST_URL}/oidc/token`,
      end_session_endpoint: `${env.FOREST_URL}/oidc/logout`,
    });
  }

  /**
   * Step 1 of the authentication
   * @param {string} redirectUrl
   * @returns {{
   *  authorizationUrl: string;
   * }}
   */
  startAuthentication(redirectUrl) {
    const client = new this.issuer.Client({
      client_id: 'forest-express-temporary-fixed-id',
      redirect_uris: [redirectUrl],
    });

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid email profile',
    });

    return { authorizationUrl };
  }
}

module.exports = AuthenticationService;
