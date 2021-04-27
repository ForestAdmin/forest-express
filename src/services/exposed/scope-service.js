const context = require('../../context');

class ScopeService {
  static async getScopes(renderingId) {
    const { configStore, forestServerRequester } = context.inject();
    const { envSecret } = configStore.lianaOptions;
    const queryParams = { renderingId };

    return forestServerRequester.perform('/liana/scopes', envSecret, queryParams);
  }

  static async getScope(renderingId, collectionName) {
    const scopes = await ScopeService.getScopes(renderingId);
    return scopes[collectionName];
  }
}

module.exports = ScopeService;
