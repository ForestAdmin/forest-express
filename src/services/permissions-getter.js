const moment = require('moment');
const P = require('bluebird');
const VError = require('verror');
const forestServerRequester = require('./forest-server-requester');

const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

class PermissionsGetter {
  constructor(environmentSecret) {
    this.environmentSecret = environmentSecret;
  }

  static expirationInSeconds = EXPIRATION_IN_SECONDS;

  // This permissions object is the cache, shared by all instances of PermissionsGetter.
  static permissions = {};

  static isRolesACLActivated;

  static cleanCache() {
    PermissionsGetter.permissions = {};
  }

  static _getPermissionsInCollections() {
    return PermissionsGetter.permissions.collections;
  }

  static _getPermissionsInRendering(renderingId) {
    return PermissionsGetter.permissions.renderings
      ? PermissionsGetter.permissions.renderings[renderingId]
      : null;
  }

  static _getCollectionPermissions(renderingId, collectionName) {
    let modelsPermissions;
    if (PermissionsGetter.isRolesACLActivated) {
      modelsPermissions = PermissionsGetter._getPermissionsInCollections();
    } else {
      modelsPermissions = PermissionsGetter._getPermissionsInRendering(renderingId);
    }
    return modelsPermissions && modelsPermissions.data
      ? modelsPermissions.data[collectionName]
      : null;
  }

  static _getScopePermissions(renderingId, collectionName) {
    const getPermissionsInRendering = PermissionsGetter._getPermissionsInRendering(renderingId);
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

  static _setRenderingPermissions(renderingId, permissions) {
    if (!PermissionsGetter.permissions.renderings) {
      PermissionsGetter.permissions.renderings = {};
    }
    PermissionsGetter.permissions.renderings[renderingId] = {
      data: permissions,
      lastRetrieve: moment(),
    };
  }

  static _setCollectionsPermissions(permissions) {
    PermissionsGetter.permissions.collections = {
      data: permissions,
      lastRetrieve: moment(),
    };
  }

  // In the teamACL format, all the permissions are stored by renderingId into "renderings".
  // For the rolesACL format, the collections permissions are stored directly into "collections",
  // and only their scopes are stored by renderingId into "renderings".
  static _setPermissions(renderingId, permissions) {
    if (PermissionsGetter.isRolesACLActivated) {
      PermissionsGetter._setCollectionsPermissions(permissions.collections);
      if (permissions.renderings && permissions.renderings[renderingId]) {
        PermissionsGetter
          ._setRenderingPermissions(renderingId, permissions.renderings[renderingId]);
      }
    } else {
      const newFormatPermissions = permissions
        ? PermissionsGetter._transformPermissionsFromOldToNewFormat(permissions)
        : null;
      PermissionsGetter._setRenderingPermissions(renderingId, newFormatPermissions);
    }
  }

  static _getLastRetrieveTimeInRendering(renderingId) {
    return PermissionsGetter._getPermissionsInRendering(renderingId)
      ? PermissionsGetter._getPermissionsInRendering(renderingId).lastRetrieve
      : null;
  }

  static _getLastRetrieveTimeInCollections() {
    return PermissionsGetter._getPermissionsInCollections()
      ? PermissionsGetter._getPermissionsInCollections().lastRetrieve
      : null;
  }

  static resetExpiration(renderingId) {
    if (PermissionsGetter.isRolesACLActivated && PermissionsGetter._getPermissionsInCollections()) {
      PermissionsGetter._getPermissionsInCollections().lastRetrieve = null;
    }

    if (PermissionsGetter._getPermissionsInRendering(renderingId)) {
      PermissionsGetter._getPermissionsInRendering(renderingId).lastRetrieve = null;
    }
  }

  static _isPermissionExpired(lastRetrieveTime) {
    if (!lastRetrieveTime) return true;
    const currentTime = moment();
    const elapsedSeconds = currentTime.diff(lastRetrieveTime, 'seconds');
    return elapsedSeconds >= PermissionsGetter.expirationInSeconds;
  }

  static _isRegularRetrievalRequired(renderingId) {
    if (PermissionsGetter.isRolesACLActivated) {
      const lastRetrieveInCollections = PermissionsGetter._getLastRetrieveTimeInCollections();
      return PermissionsGetter._isPermissionExpired(lastRetrieveInCollections);
    }
    const lastRetrieveInRendering = PermissionsGetter._getLastRetrieveTimeInRendering(renderingId);
    return PermissionsGetter._isPermissionExpired(lastRetrieveInRendering);
  }

  static _isRenderingOnlyRetrievalRequired(renderingId, permissionName) {
    const lastRetrieve = PermissionsGetter._getLastRetrieveTimeInRendering(renderingId);
    return PermissionsGetter.isRolesACLActivated
      && permissionName === 'browseEnabled'
      && PermissionsGetter._isPermissionExpired(lastRetrieve);
  }

  async _retrievePermissions(renderingId, { renderingOnly = false }) {
    const queryParams = { renderingId };
    if (renderingOnly) queryParams.renderingSpecificOnly = true;

    return forestServerRequester
      .perform('/liana/v3/permissions', this.environmentSecret, queryParams)
      .then((responseBody) => {
        PermissionsGetter.isRolesACLActivated = responseBody.meta
          ? responseBody.meta.rolesACLActivated
          : false;

        if (!responseBody.data) return null;
        if (renderingOnly) {
          return responseBody.data.renderings
            ? PermissionsGetter
              ._setRenderingPermissions(renderingId, responseBody.data.renderings[renderingId])
            : null;
        }
        return PermissionsGetter._setPermissions(renderingId, responseBody.data);
      })
      .catch((error) => P.reject(new VError(error, 'Permissions error')));
  }

  async getPermissions(renderingId, collectionName, permissionName, { forceRetrieve = false }) {
    if (forceRetrieve || PermissionsGetter._isRegularRetrievalRequired(renderingId)) {
      await this._retrievePermissions(renderingId, {});
    } else if (PermissionsGetter._isRenderingOnlyRetrievalRequired(renderingId, permissionName)) {
      await this._retrievePermissions(renderingId, { renderingOnly: true });
    }

    const collectionPermissions = PermissionsGetter
      ._getCollectionPermissions(renderingId, collectionName);
    const scope = PermissionsGetter._getScopePermissions(renderingId, collectionName);

    return {
      collection: collectionPermissions ? collectionPermissions.collection : null,
      actions: collectionPermissions ? collectionPermissions.actions : null,
      scope,
    };
  }
}

module.exports = PermissionsGetter;
