class PermissionsGetter {
  constructor({
    configStore, env, permissionsFormatter, forestServerRequester, moment, VError,
  }) {
    this.configStore = configStore;
    this.forestServerRequester = forestServerRequester;
    this.permissionsFormatter = permissionsFormatter;
    this.moment = moment;
    this.VError = VError;

    this.expirationInSeconds = env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;
  }

  // This permissions object is the cache, shared by all instances of PermissionsGetter.
  permissions = {};

  isRolesACLActivated = false;

  get environmentSecret() {
    return this.configStore.lianaOptions.envSecret;
  }

  cleanCache({ environmentId } = {}) {
    if (environmentId) {
      this.permissions[environmentId] = {};
    } else {
      this.permissions = {};
    }
  }

  _getPermissions({ environmentId, initIfNotExisting = false } = {}) {
    if (environmentId) {
      if (!this.permissions[environmentId] && initIfNotExisting) {
        this.permissions[environmentId] = {};
      }
      return this.permissions[environmentId];
    }
    return this.permissions;
  }

  _getPermissionsInCollections({ environmentId } = {}) {
    const permissions = this._getPermissions({ environmentId });
    return permissions && permissions.collections;
  }

  _getPermissionsInRendering(renderingId, { environmentId } = {}) {
    const permissions = this._getPermissions({ environmentId });
    return permissions && permissions.renderings
      ? permissions.renderings[renderingId]
      : null;
  }

  _getCollectionPermissions(renderingId, collectionName, { environmentId } = {}) {
    let modelsPermissions;
    if (this.isRolesACLActivated) {
      modelsPermissions = this._getPermissionsInCollections({ environmentId });
    } else {
      modelsPermissions = this._getPermissionsInRendering(renderingId, { environmentId });
    }
    return modelsPermissions && modelsPermissions.data
      ? modelsPermissions.data[collectionName]
      : null;
  }

  _getSegmentsPermissions(renderingId, collectionName, { environmentId } = {}) {
    const getPermissionsInRendering = this._getPermissionsInRendering(
      renderingId,
      { environmentId },
    );
    return getPermissionsInRendering
      && getPermissionsInRendering.data
      && getPermissionsInRendering.data[collectionName]
      ? getPermissionsInRendering.data[collectionName].segments
      : null;
  }

  _getStatsPermissions(renderingId, { environmentId } = {}) {
    const getPermissionsInRendering = this._getPermissionsInRendering(
      renderingId,
      { environmentId },
    );

    return getPermissionsInRendering
      && getPermissionsInRendering.data
      && getPermissionsInRendering.data.stats
      ? getPermissionsInRendering.data.stats
      : {
        queries: [],
        leaderboards: [],
        lines: [],
        objectives: [],
        percentages: [],
        pies: [],
        values: [],
      };
  }

  _setRenderingPermissions(renderingId, permissions, { environmentId } = {}) {
    const options = { environmentId, initIfNotExisting: true };
    if (!this._getPermissions(options).renderings) {
      this._getPermissions(options).renderings = {};
    }
    this._getPermissions(options).renderings[renderingId] = {
      data: permissions,
      lastRetrieve: this.moment(),
    };
  }

  _setCollectionsPermissions(permissions, { environmentId } = {}) {
    this._getPermissions({ environmentId, initIfNotExisting: true }).collections = {
      data: permissions,
      lastRetrieve: this.moment(),
    };
  }

  _setRolesACLPermissions(renderingId, permissions, { environmentId } = {}) {
    this._setCollectionsPermissions(permissions.collections, { environmentId });
    if (permissions.renderings && permissions.renderings[renderingId]) {
      this._setRenderingPermissions(
        renderingId,
        permissions.renderings[renderingId],
        { environmentId },
      );
    }
  }

  // In the teamACL format, all the permissions are stored by renderingId into "renderings".
  // For the rolesACL format, the collections permissions are stored directly into "collections",
  // and only their scopes and stats are stored by renderingId into "renderings".
  _setPermissions(renderingId, permissions, { environmentId } = {}, stats = undefined) {
    if (this.isRolesACLActivated) {
      this._setRolesACLPermissions(renderingId, permissions, { environmentId });
    } else {
      const newFormatPermissions = permissions
        ? this.permissionsFormatter.transformPermissionsFromOldToNewFormat(permissions)
        : null;
      this._setRenderingPermissions(renderingId, newFormatPermissions, { environmentId });
    }

    // NOTICE: Add stats permissions to the RenderingPermissions
    if (stats) {
      this._getPermissionsInRendering(renderingId, { environmentId }).data.stats = stats;
    }
  }

  _getLastRetrieveTimeInRendering(renderingId, { environmentId } = {}) {
    return this._getPermissionsInRendering(renderingId, { environmentId })
      ? this._getPermissionsInRendering(renderingId, { environmentId }).lastRetrieve
      : null;
  }

  _getLastRetrieveTimeInCollections({ environmentId } = {}) {
    const permissionsInCollection = this._getPermissionsInCollections({ environmentId });
    return permissionsInCollection
      ? permissionsInCollection.lastRetrieve
      : null;
  }

  resetExpiration(renderingId, { environmentId } = {}) {
    if (this.isRolesACLActivated && this._getPermissionsInCollections({ environmentId })) {
      this._getPermissionsInCollections({ environmentId }).lastRetrieve = null;
    }

    if (this._getPermissionsInRendering(renderingId, { environmentId })) {
      this._getPermissionsInRendering(renderingId, { environmentId }).lastRetrieve = null;
    }
  }

  _isPermissionExpired(lastRetrieveTime) {
    if (!lastRetrieveTime) return true;
    const currentTime = this.moment();
    const elapsedSeconds = currentTime.diff(lastRetrieveTime, 'seconds');
    return elapsedSeconds >= this.expirationInSeconds;
  }

  _isRegularRetrievalRequired(renderingId, { environmentId } = {}) {
    if (this.isRolesACLActivated) {
      const lastRetrieveInCollections = this._getLastRetrieveTimeInCollections(
        { environmentId },
      );
      return this._isPermissionExpired(lastRetrieveInCollections);
    }
    const lastRetrieveInRendering = this._getLastRetrieveTimeInRendering(
      renderingId,
      { environmentId },
    );
    return this._isPermissionExpired(lastRetrieveInRendering);
  }

  _isRenderingOnlyRetrievalRequired(renderingId, permissionName, { environmentId } = {}) {
    const lastRetrieve = this._getLastRetrieveTimeInRendering(renderingId, { environmentId });
    return this.isRolesACLActivated
      && permissionName === 'browseEnabled'
      && this._isPermissionExpired(lastRetrieve);
  }

  async _handleRetrieve(
    responseBody,
    renderingId,
    renderingOnly,
    environmentId,
  ) {
    this.isRolesACLActivated = responseBody.meta
      ? responseBody.meta.rolesACLActivated
      : false;

    if (!responseBody.data) return null;

    if (renderingOnly) {
      return responseBody.data.renderings
        ? this._setRenderingPermissions(
          renderingId,
          { stats: responseBody.stats, ...responseBody.data.renderings[renderingId] },
          { environmentId },
        )
        : null;
    }

    return this._setPermissions(
      renderingId,
      responseBody.data,
      { environmentId },
      responseBody.stats,
    );
  }

  async _retrievePermissions(renderingId, { renderingOnly = false, environmentId } = {}) {
    const queryParams = { renderingId };
    if (renderingOnly) queryParams.renderingSpecificOnly = true;

    return this.forestServerRequester
      .perform('/liana/v3/permissions', this.environmentSecret, queryParams)
      .then((res) => this._handleRetrieve(res, renderingId, renderingOnly, environmentId))
      .catch((error) => Promise.reject(new this.VError(error, 'Permissions error')));
  }

  async getPermissions(
    renderingId,
    collectionName,
    permissionName,
    { forceRetrieve = false, environmentId = undefined } = {},
  ) {
    if (forceRetrieve || this._isRegularRetrievalRequired(renderingId, { environmentId })) {
      await this._retrievePermissions(renderingId, { environmentId });
    } else if (this._isRenderingOnlyRetrievalRequired(
      renderingId,
      permissionName,
      { environmentId },
    )) {
      await this._retrievePermissions(renderingId, { renderingOnly: true, environmentId });
    }

    const collectionPermissions = this._getCollectionPermissions(
      renderingId,
      collectionName,
      { environmentId },
    );
    const segments = this._getSegmentsPermissions(renderingId, collectionName, { environmentId });
    const stats = this._getStatsPermissions(renderingId, { environmentId });

    return {
      collection: collectionPermissions ? collectionPermissions.collection : null,
      actions: collectionPermissions ? collectionPermissions.actions : null,
      stats,
      segments,
    };
  }
}

module.exports = PermissionsGetter;
