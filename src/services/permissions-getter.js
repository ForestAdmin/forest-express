class PermissionsGetter {
  constructor({
    configStore, env, forestServerRequester, moment, VError,
  }) {
    this.configStore = configStore;
    this.forestServerRequester = forestServerRequester;
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

  cleanCache() {
    this.permissions = {};
  }

  _getPermissions() {
    return this.permissions;
  }

  _getPermissionsInCollections() {
    return this._getPermissions().collections;
  }

  _getPermissionsInRendering(renderingId) {
    return this._getPermissions().renderings
      ? this._getPermissions().renderings[renderingId]
      : null;
  }

  _getCollectionPermissions(renderingId, collectionName) {
    let modelsPermissions;
    if (this.isRolesACLActivated) {
      modelsPermissions = this._getPermissionsInCollections();
    } else {
      modelsPermissions = this._getPermissionsInRendering(renderingId);
    }
    return modelsPermissions && modelsPermissions.data
      ? modelsPermissions.data[collectionName]
      : null;
  }

  _getScopePermissions(renderingId, collectionName) {
    const getPermissionsInRendering = this._getPermissionsInRendering(renderingId);
    return getPermissionsInRendering
      && getPermissionsInRendering.data
      && getPermissionsInRendering.data[collectionName]
      ? getPermissionsInRendering.data[collectionName].scope
      : null;
  }

  static _transformActionsPermissionsFromOldToNewFormat(smartActionsPermissions) {
    const newSmartActionsPermissions = {};
    Object.keys(smartActionsPermissions).forEach((actionName) => {
      const action = smartActionsPermissions[actionName];
      newSmartActionsPermissions[actionName] = {
        triggerEnabled: action.users ? action.allowed && action.users : action.allowed,
      };
    });
    return newSmartActionsPermissions;
  }

  static _transformPermissionsFromOldToNewFormat(permissions) {
    const newPermissions = {};

    Object.keys(permissions).forEach((modelName) => {
      const modelPermissions = permissions[modelName];
      const { collection } = modelPermissions;

      newPermissions[modelName] = {
        collection: {
          browseEnabled: collection.list || collection.searchToEdit,
          readEnabled: collection.show,
          editEnabled: collection.update,
          addEnabled: collection.create,
          deleteEnabled: collection.delete,
          exportEnabled: collection.export,
        },
        scope: modelPermissions.scope,
      };

      if (modelPermissions.actions) {
        newPermissions[modelName].actions = PermissionsGetter
          ._transformActionsPermissionsFromOldToNewFormat(modelPermissions.actions);
      }
    });

    return newPermissions;
  }

  _setRenderingPermissions(renderingId, permissions) {
    if (!this._getPermissions().renderings) {
      this._getPermissions().renderings = {};
    }
    this._getPermissions().renderings[renderingId] = {
      data: permissions,
      lastRetrieve: this.moment(),
    };
  }

  _setCollectionsPermissions(permissions) {
    this._getPermissions().collections = {
      data: permissions,
      lastRetrieve: this.moment(),
    };
  }

  _setRolesACLPermissions(renderingId, permissions) {
    this._setCollectionsPermissions(permissions.collections);
    if (permissions.renderings && permissions.renderings[renderingId]) {
      this._setRenderingPermissions(renderingId, permissions.renderings[renderingId]);
    }
  }

  // In the teamACL format, all the permissions are stored by renderingId into "renderings".
  // For the rolesACL format, the collections permissions are stored directly into "collections",
  // and only their scopes are stored by renderingId into "renderings".
  _setPermissions(renderingId, permissions) {
    if (this.isRolesACLActivated) {
      this._setRolesACLPermissions(renderingId, permissions);
    } else {
      const newFormatPermissions = permissions
        ? PermissionsGetter._transformPermissionsFromOldToNewFormat(permissions)
        : null;
      this._setRenderingPermissions(renderingId, newFormatPermissions);
    }
  }

  _getLastRetrieveTimeInRendering(renderingId) {
    return this._getPermissionsInRendering(renderingId)
      ? this._getPermissionsInRendering(renderingId).lastRetrieve
      : null;
  }

  _getLastRetrieveTimeInCollections() {
    return this._getPermissionsInCollections()
      ? this._getPermissionsInCollections().lastRetrieve
      : null;
  }

  resetExpiration(renderingId) {
    if (this.isRolesACLActivated && this._getPermissionsInCollections()) {
      this._getPermissionsInCollections().lastRetrieve = null;
    }

    if (this._getPermissionsInRendering(renderingId)) {
      this._getPermissionsInRendering(renderingId).lastRetrieve = null;
    }
  }

  _isPermissionExpired(lastRetrieveTime) {
    if (!lastRetrieveTime) return true;
    const currentTime = this.moment();
    const elapsedSeconds = currentTime.diff(lastRetrieveTime, 'seconds');
    return elapsedSeconds >= this.expirationInSeconds;
  }

  _isRegularRetrievalRequired(renderingId) {
    if (this.isRolesACLActivated) {
      const lastRetrieveInCollections = this._getLastRetrieveTimeInCollections();
      return this._isPermissionExpired(lastRetrieveInCollections);
    }
    const lastRetrieveInRendering = this._getLastRetrieveTimeInRendering(renderingId);
    return this._isPermissionExpired(lastRetrieveInRendering);
  }

  _isRenderingOnlyRetrievalRequired(renderingId, permissionName) {
    const lastRetrieve = this._getLastRetrieveTimeInRendering(renderingId);
    return this.isRolesACLActivated
      && permissionName === 'browseEnabled'
      && this._isPermissionExpired(lastRetrieve);
  }

  async _retrievePermissions(renderingId, { renderingOnly = false } = {}) {
    const queryParams = { renderingId };
    if (renderingOnly) queryParams.renderingSpecificOnly = true;

    return this.forestServerRequester
      .perform('/liana/v3/permissions', this.environmentSecret, queryParams)
      .then((responseBody) => {
        this.isRolesACLActivated = responseBody.meta
          ? responseBody.meta.rolesACLActivated
          : false;

        if (!responseBody.data) return null;
        if (renderingOnly) {
          return responseBody.data.renderings
            ? this._setRenderingPermissions(renderingId, responseBody.data.renderings[renderingId])
            : null;
        }
        return this._setPermissions(renderingId, responseBody.data);
      })
      .catch((error) => Promise.reject(new this.VError(error, 'Permissions error')));
  }

  async getPermissions(
    renderingId, collectionName, permissionName, { forceRetrieve = false } = {},
  ) {
    if (forceRetrieve || this._isRegularRetrievalRequired(renderingId)) {
      await this._retrievePermissions(renderingId);
    } else if (this._isRenderingOnlyRetrievalRequired(renderingId, permissionName)) {
      await this._retrievePermissions(renderingId, { renderingOnly: true });
    }

    const collectionPermissions = this._getCollectionPermissions(renderingId, collectionName);
    const scope = this._getScopePermissions(renderingId, collectionName);

    return {
      collection: collectionPermissions ? collectionPermissions.collection : null,
      actions: collectionPermissions ? collectionPermissions.actions : null,
      scope,
    };
  }
}

module.exports = PermissionsGetter;
