class OidcClientManagerService {
  /**
   * @private @readonly
   * @type {Map<string, Promise<import('openid-client').Client>>}
   */
  cache = new Map();

  /** @private @readonly */
  oidcConfigurationRetrieverService;

  /** @private @readonly */
  openIdClient;

  /** @private @readonly */
  env;

  /**
   * @param {import('../context/init').Context} dependencies
   */
  constructor({ oidcConfigurationRetrieverService, openIdClient, env }) {
    this.oidcConfigurationRetrieverService = oidcConfigurationRetrieverService;
    this.openIdClient = openIdClient;
    this.env = env;
  }

  /**
   * @param {string} callbackUrl
   * @returns {Promise<import('openid-client').Client>}
   */
  async getClientForCallbackUrl(callbackUrl) {
    if (!this.cache.has(callbackUrl)) {
      const configuration = await this.oidcConfigurationRetrieverService.retrieve();
      const issuer = new this.openIdClient.Issuer(configuration);
      const registrationPromise = issuer.Client.register({
        token_endpoint_auth_method: 'none',
        redirect_uris: [callbackUrl],
      }, {
        initialAccessToken: this.env.FOREST_ENV_SECRET,
      }).catch((error) => {
        this.cache.delete(callbackUrl);
        throw error;
      });

      this.cache.set(callbackUrl, registrationPromise);
    }

    return this.cache.get(callbackUrl);
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = OidcClientManagerService;
