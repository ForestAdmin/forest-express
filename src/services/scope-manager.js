import _ from 'lodash';
import context from '../context';

// 5 minutes exipration cache
const SCOPE_CACHE_EXPIRATION_DELTA = 300;

class ScopeManager {
  constructor({
    configStore, forestServerRequester, moment, logger,
  } = context.inject()) {
    this.configStore = configStore;
    this.forestServerRequester = forestServerRequester;
    this.moment = moment;
    this.logger = logger;
    this.scopesCache = {};
  }

  async getScopeForUser(user, collectionName, asString = false) {
    if (!user.renderingId) throw new Error('Missing required renderingId');
    if (!collectionName) throw new Error('Missing required collectionName');

    const collectionScope = await this._getScopeCollectionScope(user.renderingId, collectionName);
    const filters = ScopeManager._formatDynamicValues(user.id, collectionScope);

    return asString ? JSON.stringify(filters) : filters;
  }

  static _formatDynamicValues(userId, collectionScope) {
    if (!collectionScope?.scope?.filter) return null;

    return _.cloneDeepWith(collectionScope.scope.filter, (item) => (
      typeof item === 'string' && item.startsWith('$currentUser')
        ? collectionScope.scope.dynamicScopesValues.users[userId][item]
        : undefined
    ));
  }

  async _getScopeCollectionScope(renderingId, collectionName) {
    // if scopes have never been fetched before, wait for those to be retrieved
    if (!this.scopesCache[renderingId]) {
      await this._refreshScopesCache(renderingId);
    } else if (this._hasCacheExpired(renderingId)) {
    // if cache expired fetch scopes but don't wait for it
      this._refreshScopesCache(renderingId)
        .catch((error) => {
          this.logger.error(error.message);
        });
    }

    return this.scopesCache[renderingId].scopes[collectionName];
  }

  async _fetchScopes(renderingId) {
    const { envSecret } = this.configStore.lianaOptions;
    const queryParams = { renderingId };

    return this.forestServerRequester.perform('/liana/scopes', envSecret, queryParams);
  }

  async _refreshScopesCache(renderingId) {
    // if scopes have already been fetched before set `fetchedAt` upfront to avoid race conditions
    if (this.scopesCache[renderingId]?.fetchedAt) {
      const lastFetchTime = this.scopesCache[renderingId].fetchedAt;
      this.scopesCache[renderingId].fetchedAt = this.moment();
      try {
        this.scopesCache[renderingId].scopes = await this._fetchScopes(renderingId);
      } catch {
        // reset `fetchedAt` on failed retrieve
        this.scopesCache[renderingId].fetchedAt = lastFetchTime;
        throw new Error('Unable to fetch scopes');
      }
    } else {
      const scopes = await this._fetchScopes(renderingId);
      this.scopesCache[renderingId] = {
        fetchedAt: this.moment(),
        scopes,
      };
    }
  }

  _hasCacheExpired(renderingId) {
    const renderingScopes = this.scopesCache[renderingId];
    if (!renderingScopes) return true;

    const secondsSinceLastFetch = this.moment().diff(renderingScopes.fetchedAt, 'seconds');
    return secondsSinceLastFetch >= SCOPE_CACHE_EXPIRATION_DELTA;
  }
}

module.exports = ScopeManager;
