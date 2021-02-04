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

  cleanCache({ storePermissionsInto } = {}) {
    if (storePermissionsInto) {
      this.permissions[storePermissionsInto] = {};
    } else {
      this.permissions = {};
    }
  }

  _getPermissions({ storePermissionsInto, initIfNotExisting = false } = {}) {
    if (storePermissionsInto) {
      if (!this.permissions[storePermissionsInto] && initIfNotExisting) {
        this.permissions[storePermissionsInto] = {};
      }
      return this.permissions[storePermissionsInto];
    }
    return this.permissions;
  }

  _getPermissionsInCollections({ storePermissionsInto } = {}) {
    const permissions = this._getPermissions({ storePermissionsInto });
    return permissions && permissions.collections;
  }

  _getPermissionsInRendering(renderingId, { storePermissionsInto } = {}) {
    const permissions = this._getPermissions({ storePermissionsInto });
    return permissions && permissions.renderings
      ? permissions.renderings[renderingId]
      : null;
  }

  _getCollectionPermissions(renderingId, collectionName, { storePermissionsInto } = {}) {
    let modelsPermissions;
    if (this.isRolesACLActivated) {
      modelsPermissions = this._getPermissionsInCollections({ storePermissionsInto });
    } else {
      modelsPermissions = this._getPermissionsInRendering(renderingId, { storePermissionsInto });
    }
    return modelsPermissions && modelsPermissions.data
      ? modelsPermissions.data[collectionName]
      : null;
  }

  _getScopePermissions(renderingId, collectionName, { storePermissionsInto } = {}) {
    const getPermissionsInRendering = this._getPermissionsInRendering(
      renderingId, { storePermissionsInto },
    );
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

  _setRenderingPermissions(renderingId, permissions, { storePermissionsInto } = {}) {
    const options = { storePermissionsInto, initIfNotExisting: true };
    if (!this._getPermissions(options).renderings) {
      this._getPermissions(options).renderings = {};
    }
    this._getPermissions(options).renderings[renderingId] = {
      data: permissions,
      lastRetrieve: this.moment(),
    };
  }

  _setCollectionsPermissions(permissions, { storePermissionsInto } = {}) {
    this._getPermissions({ storePermissionsInto, initIfNotExisting: true }).collections = {
      data: permissions,
      lastRetrieve: this.moment(),
    };
  }

  _setRolesACLPermissions(renderingId, permissions, { storePermissionsInto } = {}) {
    this._setCollectionsPermissions(permissions.collections, { storePermissionsInto });
    if (permissions.renderings && permissions.renderings[renderingId]) {
      this._setRenderingPermissions(
        renderingId, permissions.renderings[renderingId], { storePermissionsInto },
      );
    }
  }

  // In the teamACL format, all the permissions are stored by renderingId into "renderings".
  // For the rolesACL format, the collections permissions are stored directly into "collections",
  // and only their scopes are stored by renderingId into "renderings".
  _setPermissions(renderingId, permissions, { storePermissionsInto } = {}) {
    if (this.isRolesACLActivated) {
      this._setRolesACLPermissions(renderingId, permissions, { storePermissionsInto });
    } else {
      const newFormatPermissions = permissions
        ? PermissionsGetter._transformPermissionsFromOldToNewFormat(permissions)
        : null;
      this._setRenderingPermissions(renderingId, newFormatPermissions, { storePermissionsInto });
    }
  }

  _getLastRetrieveTimeInRendering(renderingId, { storePermissionsInto } = {}) {
    return this._getPermissionsInRendering(renderingId, { storePermissionsInto })
      ? this._getPermissionsInRendering(renderingId, { storePermissionsInto }).lastRetrieve
      : null;
  }

  _getLastRetrieveTimeInCollections({ storePermissionsInto } = {}) {
    const permissionsInCollection = this._getPermissionsInCollections({ storePermissionsInto });
    return permissionsInCollection
      ? permissionsInCollection.lastRetrieve
      : null;
  }

  resetExpiration(renderingId, { storePermissionsInto } = {}) {
    if (this.isRolesACLActivated && this._getPermissionsInCollections({ storePermissionsInto })) {
      this._getPermissionsInCollections({ storePermissionsInto }).lastRetrieve = null;
    }

    if (this._getPermissionsInRendering(renderingId, { storePermissionsInto })) {
      this._getPermissionsInRendering(renderingId, { storePermissionsInto }).lastRetrieve = null;
    }
  }

  _isPermissionExpired(lastRetrieveTime) {
    if (!lastRetrieveTime) return true;
    const currentTime = this.moment();
    const elapsedSeconds = currentTime.diff(lastRetrieveTime, 'seconds');
    return elapsedSeconds >= this.expirationInSeconds;
  }

  _isRegularRetrievalRequired(renderingId, { storePermissionsInto } = {}) {
    if (this.isRolesACLActivated) {
      const lastRetrieveInCollections = this._getLastRetrieveTimeInCollections(
        { storePermissionsInto },
      );
      return this._isPermissionExpired(lastRetrieveInCollections);
    }
    const lastRetrieveInRendering = this._getLastRetrieveTimeInRendering(
      renderingId, { storePermissionsInto },
    );
    return this._isPermissionExpired(lastRetrieveInRendering);
  }

  _isRenderingOnlyRetrievalRequired(renderingId, permissionName, { storePermissionsInto } = {}) {
    const lastRetrieve = this._getLastRetrieveTimeInRendering(
      renderingId, { storePermissionsInto },
    );
    return this.isRolesACLActivated
      && permissionName === 'browseEnabled'
      && this._isPermissionExpired(lastRetrieve);
  }

  async _retrievePermissions(renderingId, { renderingOnly = false, storePermissionsInto } = {}) {
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
            ? this._setRenderingPermissions(
              renderingId, responseBody.data.renderings[renderingId], { storePermissionsInto },
            )
            : null;
        }
        return this._setPermissions(renderingId, responseBody.data, { storePermissionsInto });
      })
      .catch((error) => Promise.reject(new this.VError(error, 'Permissions error')));
  }

  async getPermissions(
    renderingId,
    collectionName,
    permissionName,
    { forceRetrieve = false, storePermissionsInto = undefined } = {},
  ) {
    if (forceRetrieve || this._isRegularRetrievalRequired(renderingId, { storePermissionsInto })) {
      await this._retrievePermissions(renderingId, { storePermissionsInto });
    } else if (this._isRenderingOnlyRetrievalRequired(
      renderingId, permissionName, { storePermissionsInto },
    )) {
      await this._retrievePermissions(renderingId, { renderingOnly: true, storePermissionsInto });
    }

    const collectionPermissions = this._getCollectionPermissions(
      renderingId, collectionName, { storePermissionsInto },
    );
    const scope = this._getScopePermissions(renderingId, collectionName, { storePermissionsInto });

    return {
      collection: collectionPermissions ? collectionPermissions.collection : null,
      actions: collectionPermissions ? collectionPermissions.actions : null,
      scope,
    };
  }
}

module.exports = PermissionsGetter;
