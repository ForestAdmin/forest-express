const DEFAULT_EXPIRATION_IN_SECONDS = 30 * 60;

class OidcConfigurationRetrieverService {
  /** @type {import('./forest-server-requester')} */
  forestServerRequester;

  /** @type {import('../context/init').Env} */
  env;

  /** @type {Promise<{configuration: import('openid-client').IssuerMetadata, expiration: Date}>} */
  cachedWellKnownConfiguration;

  /**
   * @param {import("../context/init").Context} context
   */
  constructor(context) {
    this.forestServerRequester = context.forestServerRequester;
    this.env = context.env;
  }

  /**
   * @private
   * @returns {Promise<import('openid-client').IssuerMetadata>}
   */
  async _fetchConfiguration() {
    return this.forestServerRequester.perform('/oidc/.well-known/openid-configuration');
  }

  /**
   * @returns {Promise<import('openid-client').IssuerMetadata>}
   */
  async retrieve() {
    const now = new Date();

    if (this.cachedWellKnownConfiguration
      && (await this.cachedWellKnownConfiguration).expiration < now) {
      this.clearCache();
    }

    if (!this.cachedWellKnownConfiguration) {
      this.cachedWellKnownConfiguration = this._fetchConfiguration()
        .then((configuration) => {
          const expirationDuration = this.env.FOREST_OIDC_CONFIG_EXPIRATION_IN_SECONDS
              || DEFAULT_EXPIRATION_IN_SECONDS;
          const expiration = new Date(Date.now() + expirationDuration);
          return { configuration, expiration };
        })
        .catch((error) => {
          this.cachedWellKnownConfiguration = null;
          throw error;
        });
    }

    return (await this.cachedWellKnownConfiguration).configuration;
  }

  clearCache() {
    this.cachedWellKnownConfiguration = null;
  }
}

module.exports = OidcConfigurationRetrieverService;
