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

  /**
   * @param {import('../context/init').Context} dependencies
   */
  constructor({ oidcConfigurationRetrieverService, openIdClient }) {
    this.oidcConfigurationRetrieverService = oidcConfigurationRetrieverService;
    this.openIdClient = openIdClient;
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
      }).catch((error) => {
        this.cache.delete(callbackUrl);
        throw error;
      });

      this.cache.set(callbackUrl, registrationPromise);
    }

    return this.cache.get(callbackUrl);
  }
}

module.exports = OidcClientManagerService;
