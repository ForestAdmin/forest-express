import context from '../context';

// 5 minutes exipration cache
const SCOPE_CACHE_EXPIRATION_DELTA = 300;

class ScopeManager {
  constructor({ configStore, forestServerRequester, moment } = context.inject()) {
    this.configStore = configStore;
    this.forestServerRequester = forestServerRequester;
    this.moment = moment;
    this.scopesCache = {};
  }

  async getScopeForUser(user, collectionName) {
    if (!user.renderingId) throw new Error('Missing required renderingId');
    if (!collectionName) throw new Error('Missing required collectionName');

    const collectionScope = await this._getScopeCollectionScope(user.renderingId, collectionName);

    return ScopeManager._formatDynamicValues(user.id, collectionScope);
  }

  static _formatDynamicValues(userId, collectionScope) {
    if (!collectionScope?.scope?.filter) return null;

    collectionScope.scope.filter.conditions.forEach((condition) => {
      if (condition.value
        && `${condition.value}`.startsWith('$')
        && collectionScope.scope.dynamicScopesValues.users[userId]) {
        condition.value = collectionScope
          .scope
          .dynamicScopesValues
          .users[userId][condition.value];
      }
    });

    return collectionScope.scope.filter;
  }

  async _getScopeCollectionScope(renderingId, collectionName) {
    // if scopes have never been fetched before, wait for those to be retrieved
    if (!this.scopesCache[renderingId]) {
      await this._refreshScopesCache(renderingId);
    } else if (this._hasCacheExpired(renderingId)) {
    // if cache expired fetch scopes but don't wait for it
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

module.exports = ScopeManager;
