const moment = require('moment');
const P = require('bluebird');
const VError = require('verror');
const forestServerRequester = require('./forest-server-requester');

const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

class PermissionsGetter {
  static expirationInSeconds = EXPIRATION_IN_SECONDS;

  // This permissions object is the cache, shared by all instances of PermissionsGetter.
  static permissions = {};

  static isRolesACLActivated;

  static cleanCache() {
    PermissionsGetter.permissions = {};
  }

  static getPermissionsInCollections() {
    return PermissionsGetter.permissions.collections;
  }

  static getPermissionsInRendering(renderingId) {
    return PermissionsGetter.permissions.renderings
      ? PermissionsGetter.permissions.renderings[renderingId]
      : null;
  }

  static _getCollectionPermissions(renderingId, collectionName) {
    let modelsPermissions;
    if (PermissionsGetter.isRolesACLActivated) {
      modelsPermissions = PermissionsGetter.getPermissionsInCollections();
    } else {
      modelsPermissions = PermissionsGetter.getPermissionsInRendering(renderingId);
    }
    return modelsPermissions && modelsPermissions.data
      ? modelsPermissions.data[collectionName]
      : null;
  }

  static getPermissions(renderingId, collectionName) {
    const collectionPermissions = PermissionsGetter
      ._getCollectionPermissions(renderingId, collectionName);
    const scope = PermissionsGetter.getPermissionsInRendering(renderingId)
      && PermissionsGetter.getPermissionsInRendering(renderingId).data
      && PermissionsGetter.getPermissionsInRendering(renderingId).data[collectionName]
      ? PermissionsGetter.getPermissionsInRendering(renderingId).data[collectionName].scope
      : null;

    return {
      collection: collectionPermissions ? collectionPermissions.collection : null,
      actions: collectionPermissions ? collectionPermissions.actions : null,
      scope,
    };
  }

  static _transformActionsPermissionsFromOldToNewFormat(smartActionsPermissions) {
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
        newPermissions[modelName].actions = PermissionsGetter
          ._transformActionsPermissionsFromOldToNewFormat(modelPermissions.actions);
      }
    });

    return newPermissions;
  }

  static _setTeamsACLPermissions(renderingId, permissions) {
    const newFormatPermissions = permissions
      ? PermissionsGetter.transformPermissionsFromOldToNewFormat(permissions)
      : null;

    if (!PermissionsGetter.permissions.renderings) {
      PermissionsGetter.permissions.renderings = {};
    }
    PermissionsGetter.permissions.renderings[renderingId] = {
      data: newFormatPermissions,
      lastRetrieve: moment(),
    };
  }

  static _setRolesACLPermissions(renderingId, permissions) {
    PermissionsGetter.permissions.collections = {
      data: permissions.collections,
      lastRetrieve: moment(),
    };

    if (!PermissionsGetter.permissions.renderings) {
      PermissionsGetter.permissions.renderings = {};
    }
    PermissionsGetter.permissions.renderings[renderingId] = {
      data: permissions.renderings ? permissions.renderings[renderingId] : null,
      lastRetrieve: moment(),
    };
  }

  // In the teamACL format, all the permissions are stored by renderingId into "renderings".
  // For the rolesACL format, the collections permissions are stored directly into "collections",
  // and only their scopes are stored by renderingId into "renderings".
  static _setPermissions(renderingId, permissions) {
    if (PermissionsGetter.isRolesACLActivated) {
      PermissionsGetter._setRolesACLPermissions(renderingId, permissions);
    } else {
      PermissionsGetter._setTeamsACLPermissions(renderingId, permissions);
    }
  }

  static getLastRetrieveTime(renderingId, permissionName) {
    // In the case of rolesACL format and browseEnabled permission, the last retrieve to be taken
    // into account is the one stored by rendering (because of the scope information).
    if (PermissionsGetter.isRolesACLActivated && PermissionsGetter.getPermissionsInCollections() && permissionName !== 'browseEnabled') {
      return PermissionsGetter.getPermissionsInCollections().lastRetrieve;
    }
    return PermissionsGetter.getPermissionsInRendering(renderingId)
      ? PermissionsGetter.getPermissionsInRendering(renderingId).lastRetrieve
      : null;
  }

  static resetExpiration(renderingId) {
    if (PermissionsGetter.isRolesACLActivated && PermissionsGetter.getPermissionsInCollections()) {
      PermissionsGetter.getPermissionsInCollections().lastRetrieve = null;
    }

    if (PermissionsGetter.getPermissionsInRendering(renderingId)) {
      PermissionsGetter.getPermissionsInRendering(renderingId).lastRetrieve = null;
    }
  }

  static isPermissionExpired(renderingId, permissionName) {
    const currentTime = moment();
    const lastRetrieve = PermissionsGetter.getLastRetrieveTime(renderingId, permissionName);


    if (!lastRetrieve) {
      return true;
    }

    const elapsedSeconds = currentTime.diff(lastRetrieve, 'seconds');
    return elapsedSeconds >= PermissionsGetter.expirationInSeconds;
  }

  static async retrievePermissions(environmentSecret, renderingId) {
    return forestServerRequester
      .perform('/liana/v3/permissions', environmentSecret, { renderingId })
      .then((responseBody) => {
        PermissionsGetter.isRolesACLActivated = responseBody.meta
          ? responseBody.meta.rolesACLActivated
          : false;
        PermissionsGetter._setPermissions(renderingId, responseBody.data);
      })
      .catch((error) => P.reject(new VError(error, 'Permissions error')));
  }
}

module.exports = PermissionsGetter;
