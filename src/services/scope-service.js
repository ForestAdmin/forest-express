const context = require('../context');

class ScopeService {
  constructor({ permissionsGetter, configStore, forestServerRequester } = context.inject()) {
    this.permissionsGetter = permissionsGetter;
    this.configStore = configStore;
    this.forestServerRequester = forestServerRequester;
    this.scopes = {};
  }

  get environmentSecret() {
    return this.configStore.lianaOptions.envSecret;
  }

  async getScopes(renderingId) {
    const queryParams = { renderingId };

    return this.forestServerRequester.perform('/liana/scopes', this.environmentSecret, queryParams);
  }
}

module.exports = ScopeService;
