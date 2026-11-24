const { inject } = require('@forestadmin/context');
const { parseFiltersString } = require('./base-filters-parser');

class ScopeManager {
  constructor({
    forestAdminClient,
  } = inject()) {
    /** @private @readonly @type {import('@forestadmin/forestadmin-client').ForestAdminClient} */
    this.forestAdminClient = forestAdminClient;
  }

  async appendScopeForUser(existingFilter, user, collectionName) {
    const scopeFilter = await this.getScopeForUser(user, collectionName);

    if (!scopeFilter) return existingFilter || undefined;
    if (!existingFilter) return JSON.stringify(scopeFilter);

    return JSON.stringify({
      aggregator: 'and',
      conditions: [parseFiltersString(existingFilter), scopeFilter],
    });
  }

  async getScopeForUser(user, collectionName, asString = false) {
    if (!user) throw new Error('Missing required user');
    if (!user.renderingId) throw new Error('Missing required renderingId');
    if (!collectionName) throw new Error('Missing required collectionName');

    const scopeFilters = await this.forestAdminClient.getScope({
      renderingId: user.renderingId,
      userId: user.id,
      collectionName,
    });

    return asString && !!scopeFilters ? JSON.stringify(scopeFilters) : scopeFilters;
  }

  // Whether the collection's scope also hides its records reached through a relation.
  // A client that does not read the flag yet reads as not flagged.
  async scopeAppliesToRelatedRecords(user, collectionName) {
    if (!this.forestAdminClient.scopeAppliesToRelatedRecords) return false;

    return this.forestAdminClient.scopeAppliesToRelatedRecords({
      renderingId: user.renderingId,
      collectionName,
    });
  }

  invalidateScopeCache(renderingId) {
    this.forestAdminClient.markScopesAsUpdated(renderingId);
  }
}

module.exports = ScopeManager;
