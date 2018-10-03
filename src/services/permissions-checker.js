const P = require('bluebird');
const forestServerRequester = require('./forest-server-requester');
const moment = require('moment');
const VError = require('verror');

let permissionsPerRendering = {};

function PermissionsChecker(environmentSecret, renderingId, collectionName, permissionName, smartActionId, endpoint) {
  const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

  function isCollectionAllowed() {
    const permissions =
      permissionsPerRendering[renderingId] && permissionsPerRendering[renderingId].data;

    if (!permissions || !permissions[collectionName] || !permissions[collectionName].collection) {
      return false;
    }

    if (permissionName === 'execute') {
      return true;
    }

    return permissions[collectionName].collection[permissionName];
  }

  function isSmartActionAllowed() {
    const permissions =
      permissionsPerRendering[renderingId] && permissionsPerRendering[renderingId].data;

    if (!permissions
      || !permissions[collectionName]
      || !permissions[collectionName].smartActions
      || !permissions[collectionName].smartActions[smartActionId]
      || !permissions[collectionName].smartActions[smartActionId].endpoint) {
      return false;
    }

    if (permissions[collectionName].smartActions[smartActionId].endpoint !== endpoint) {
      // NOTICE: The user tries to call the wrong smart action route
      return false;
    }

    return permissions[collectionName].smartActions[smartActionId][permissionName];
  }

  function retrievePermissions() {
    return forestServerRequester
      .perform('/liana/v2/permissions', environmentSecret, { renderingId })
      .then((responseBody) => {
        permissionsPerRendering[renderingId] = {
          data: responseBody,
          lastRetrieve: moment(),
        };
      })
      .catch((error) => {
        return P.reject(new VError(error, 'Permissions error'));
      });
  }

  function isPermissionExpired() {
    if (!permissionsPerRendering[renderingId] ||
      !permissionsPerRendering[renderingId].lastRetrieve) {
      return true;
    }

    const { lastRetrieve } = permissionsPerRendering[renderingId];
    const currentTime = moment();

    if (!lastRetrieve) {
      return true;
    }

    const elapsedSeconds = currentTime.diff(lastRetrieve, 'seconds');

    return elapsedSeconds >= EXPIRATION_IN_SECONDS;
  }

  async function retrievePermissionsAndCheckAllowed() {
    await retrievePermissions();

    const collectionAllowed = await isCollectionAllowed();

    if (!collectionAllowed) {
      throw new Error(`'${permissionName}' access forbidden on collection '${collectionName}'`);
    }

    if (smartActionId) {
      const smartActionAllowed = await isSmartActionAllowed();
      if (!smartActionAllowed) {
        throw new Error(`Smart action '${smartActionId}' execution forbidden on collection '${collectionName}'`);
      }
    }
  }

  this.perform = async () => {
    if (isPermissionExpired()) {
      return retrievePermissionsAndCheckAllowed();
    }

    if (!isCollectionAllowed(collectionName, permissionName)
      || (smartActionId && !isSmartActionAllowed(collectionName, smartActionId, permissionName))) {
      return retrievePermissionsAndCheckAllowed();
    }
  };
}

PermissionsChecker.cleanCache = () => {
  permissionsPerRendering = {};
};

PermissionsChecker.resetExpiration = (renderingId) => {
  const permissions =
    permissionsPerRendering[renderingId] && permissionsPerRendering[renderingId].data;

  if (permissions) {
    permissions.lastRetrieve = null;
  }
};

PermissionsChecker.getLastRetrieveTime = (renderingId) => {
  if (!permissionsPerRendering[renderingId]) {
    return null;
  }

  return permissionsPerRendering[renderingId].lastRetrieve;
};

PermissionsChecker.getPermissions = (renderingId) => {
  if (!permissionsPerRendering[renderingId]) {
    return null;
  }

  return permissionsPerRendering[renderingId].data;
};

module.exports = PermissionsChecker;
