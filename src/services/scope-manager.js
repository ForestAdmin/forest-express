const { inject } = require('@forestadmin/context');

class ScopeManager {
  constructor({
    forestAdminClient,
  } = inject()) {
    /** @private @readonly @type {import('@forestadmin/forestadmin-client').ForestAdminClient} */
    this.forestAdminClient = forestAdminClient;
  }

  async appendScopeForUser(existingFilter, user, collectionName) {
    const scopeFilter = await this.getScopeForUser(user, collectionName, true);
    const filters = [existingFilter, scopeFilter].filter(Boolean);

    switch (filters.length) {
      case 0:
        return undefined;
      case 1:
        return filters[0];
      default:
        return `{"aggregator":"and","conditions":[${existingFilter},${scopeFilter}]}`;
    }
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

  invalidateScopeCache(renderingId) {
    this.forestAdminClient.markScopesAsUpdated(renderingId);
  }
}

module.exports = ScopeManager;
