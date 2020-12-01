const moment = require('moment');
const P = require('bluebird');
const VError = require('verror');
const forestServerRequester = require('./forest-server-requester');

const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

class PermissionsCache {
  static expirationInSeconds = EXPIRATION_IN_SECONDS;

  // This permissions object is the cache, shared by all instances of PermissionsCache.
  static permissions = {};

  static isRolesACLActivated;

  static cleanCache() {
    PermissionsCache.permissions = {};
  }

  static _getCollectionsPermissions() {
    return PermissionsCache.permissions.collections;
  }

  static _getRenderingPermissions(renderingId) {
    return PermissionsCache.permissions.renderings
      ? PermissionsCache.permissions.renderings[renderingId]
      : null;
  }

  // In the teamACL format, all the permissions are stored by renderingId into "renderings".
  // For the rolesACL format, the collections permissions are stored directly into "collections",
  // and only their scopes are stored by renderingId into "renderings".
  static getPermissions(renderingId) {
    const collectionsPermissions = PermissionsCache._getCollectionsPermissions();
    const renderingPermissions = PermissionsCache._getRenderingPermissions(renderingId);
    if (PermissionsCache.isRolesACLActivated) {
      return collectionsPermissions ? collectionsPermissions.data : null;
    }
    return renderingPermissions ? renderingPermissions.data : null;
  }

  static getScopePermissions(renderingId, collectionName) {
    const renderingPermissions = PermissionsCache._getRenderingPermissions(renderingId);
    if (renderingPermissions && renderingPermissions.data
      && renderingPermissions.data[collectionName]) {
      return renderingPermissions.data[collectionName].scope;
    }
    return null;
  }

  static _transformSmartActionsPermissionsFromOldToNewFormat(smartActionsPermissions) {
    let newSmartActionsPermissions = {};
    Object.keys(smartActionsPermissions).forEach((actionName) => {
      const action = smartActionsPermissions[actionName];
      newSmartActionsPermissions = {
        ...newSmartActionsPermissions.actions,
        [actionName]: {
          triggerEnabled: action.users ? action.allowed && action.users : action.allowed,
        },
      };
    });
    return newSmartActionsPermissions;
  }

  static transformPermissionsFromOldToNewFormat(permissions) {
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
        newPermissions[modelName].actions = PermissionsCache
          ._transformSmartActionsPermissionsFromOldToNewFormat(modelPermissions.actions);
      }
    });

    return newPermissions;
  }

  static _setTeamsACLPermissions(renderingId, permissions) {
    const newFormatPermissions = permissions
      ? PermissionsCache.transformPermissionsFromOldToNewFormat(permissions)
      : null;

    PermissionsCache.permissions.renderings = {
      ...PermissionsCache.permissions.renderings,
      [renderingId]: {
        data: newFormatPermissions,
        lastRetrieve: moment(),
      },
    };
  }

  static _setRolesACLPermissions(renderingId, permissions) {
    PermissionsCache.permissions.collections = {
      data: permissions.collections,
      lastRetrieve: moment(),
    };
    PermissionsCache.permissions.renderings = {
      ...PermissionsCache.permissions.renderings,
      [renderingId]: {
        data: permissions.renderings ? permissions.renderings[renderingId] : null,
        lastRetrieve: moment(),
      },
    };
  }

  static _setPermissions(renderingId, permissions) {
    if (PermissionsCache.isRolesACLActivated) {
      PermissionsCache._setRolesACLPermissions(renderingId, permissions);
    } else {
      PermissionsCache._setTeamsACLPermissions(renderingId, permissions);
    }
  }

  static getLastRetrieveTime(renderingId, permissionName) {
    // In the case of rolesACL format and browseEnabled permission, the last retrieve to be taken
    // into account is the one stored by rendering (because of the scope information).
    if (PermissionsCache.isRolesACLActivated && PermissionsCache._getCollectionsPermissions() && permissionName !== 'browseEnabled') {
      return PermissionsCache._getCollectionsPermissions().lastRetrieve;
    }
    return PermissionsCache._getRenderingPermissions(renderingId)
      ? PermissionsCache._getRenderingPermissions(renderingId).lastRetrieve
      : null;
  }

  static resetExpiration(renderingId) {
    if (PermissionsCache.isRolesACLActivated && PermissionsCache._getCollectionsPermissions()) {
      PermissionsCache._getCollectionsPermissions().lastRetrieve = null;
    }

    if (PermissionsCache._getRenderingPermissions(renderingId)) {
      PermissionsCache._getRenderingPermissions(renderingId).lastRetrieve = null;
    }
  }

  static isPermissionExpired(renderingId, permissionName) {
    const currentTime = moment();
    const lastRetrieve = PermissionsCache.getLastRetrieveTime(renderingId, permissionName);

    if (!lastRetrieve) {
      return true;
    }

    const elapsedSeconds = currentTime.diff(lastRetrieve, 'seconds');
    return elapsedSeconds >= PermissionsCache.expirationInSeconds;
  }

  static async retrievePermissions(environmentSecret, renderingId) {
    return forestServerRequester
      .perform('/liana/v3/permissions', environmentSecret, { renderingId })
      .then((responseBody) => {
        PermissionsCache.isRolesACLActivated = responseBody.meta
          ? responseBody.meta.rolesACLActivated
          : false;
        PermissionsCache._setPermissions(renderingId, responseBody.data);
      })
      .catch((error) => P.reject(new VError(error, 'Permissions error')));
  }
}

module.exports = PermissionsCache;
