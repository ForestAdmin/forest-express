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

  /** @private @readonly */
  logger;

  /**
   * @param {import('../context/init').Context} dependencies
   */
  constructor({
    oidcConfigurationRetrieverService, openIdClient, env, logger, configStore,
  }) {
    this.oidcConfigurationRetrieverService = oidcConfigurationRetrieverService;
    this.openIdClient = openIdClient;
    this.env = env;
    this.logger = logger;
    this.configStore = configStore;
  }

  /**
   * @param {string} callbackUrl
   * @returns {Promise<import('openid-client').Client>}
   */
  async getClientForCallbackUrl(callbackUrl) {
    if (!this.cache.has(callbackUrl)) {
      const configuration = await this.oidcConfigurationRetrieverService.retrieve();
      const issuer = new this.openIdClient.Issuer(configuration);
      const clientId = this.configStore.lianaOptions.clientId
        || this.env.FOREST_CLIENT_ID
        || undefined;
      const envSecret = this.configStore.lianaOptions.envSecret
        || this.env.FOREST_ENV_SECRET;

      const registration = {
        client_id: clientId,
        redirect_uris: [callbackUrl],
        token_endpoint_auth_method: 'none',
      };

      const registrationPromise = clientId
        ? new issuer.Client(registration)
        : issuer.Client.register(registration, { initialAccessToken: envSecret }).catch((error) => {
          this.logger.error('Unable to register the client', {
            configuration,
            registration,
            error,
          });
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
