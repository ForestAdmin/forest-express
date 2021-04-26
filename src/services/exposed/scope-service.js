const context = require('../../context');

class ScopeService {
  static async getScopes(renderingId) {
    const { configStore, forestServerRequester } = context.inject();
    const { envSecret } = configStore.lianaOptions;
    const queryParams = { renderingId };

    return forestServerRequester.perform('/liana/scopes', envSecret, queryParams);
  }
}

module.exports = ScopeService;
