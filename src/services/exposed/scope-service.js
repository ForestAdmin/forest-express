import context from '../../context';

// 5 minutes exipration cache
const SCOPE_CACHE_EXPIRATION_DELTA = 300;

class ScopeService {
  constructor({ configStore, forestServerRequester, moment } = context.inject()) {
    this.configStore = configStore;
    this.forestServerRequester = forestServerRequester;
    this.moment = moment;
    this.scopesCache = {};
  }

  async getScope(renderingId, collectionName) {
    // if scopes have never been fetched before, wait for those to be retrieved
    if (!this.scopesCache[renderingId]) {
      await this._refreshScopesCache(renderingId);
    }

    // if cache expired fetch scopes but don't wait for it
    if (this._hasCacheExpired(renderingId)) {
      this._refreshScopesCache(renderingId);
    }

    return this.scopesCache[renderingId].scopes[collectionName];
  }

  async _fetchScopes(renderingId) {
    const { envSecret } = this.configStore.lianaOptions;
    const queryParams = { renderingId };

    return this.forestServerRequester.perform('/liana/scopes', envSecret, queryParams);
  }

  async _refreshScopesCache(renderingId) {
    const scopes = await this._fetchScopes(renderingId);
    this.scopesCache[renderingId] = {
      fetchedAt: this.moment(),
      scopes,
    };
  }

  _hasCacheExpired(renderingId) {
    const renderingScopes = this.scopesCache[renderingId];
    if (!renderingScopes) return true;

    const secondsSinceLastFetch = this.moment().diff(renderingScopes.fetchedAt, 'seconds');
    return secondsSinceLastFetch >= SCOPE_CACHE_EXPIRATION_DELTA;
  }
}

module.exports = ScopeService;
