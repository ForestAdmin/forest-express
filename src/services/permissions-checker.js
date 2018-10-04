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
      return {
        allowed: false,
        error: `'${permissionName}' access forbidden on collection '${collectionName}'`,
      };
    }

    if (permissionName === 'execute') {
      const isAllowed = isSmartActionAllowed();
      return isAllowed
        ? { allowed: true }
        : {
          allowed: false,
          error: `Smart action '${getActionName()}' execution forbidden on collection '${collectionName}'`,
        };
    }

    const isAllowed = permissions[collectionName].collection[permissionName];
    if (!isAllowed) {
      return {
        allowed: false,
        error: `'${permissionName}' access forbidden on collection '${collectionName}'`,
      };
    }

    return { allowed: true };
  }

  function isSmartActionAllowed() {
    const permissions = permissionsPerRendering[renderingId].data;

    if (!permissions[collectionName].smartActions
      || !permissions[collectionName].smartActions[smartActionId]
      || !permissions[collectionName].smartActions[smartActionId].endpoint) {
      return false;
    }

    if (permissions[collectionName].smartActions[smartActionId].endpoint !== endpoint) {
      // NOTICE: The user tries to call the wrong smart action route
      return false;
    }

    return permissions[collectionName].smartActions[smartActionId].execute;
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

  function getActionName() {
    const permissions =
      permissionsPerRendering[renderingId] && permissionsPerRendering[renderingId].data;

    if (!permissions
      || !permissions[collectionName]
      || !permissions[collectionName].smartActions
      || !permissions[collectionName].smartActions[smartActionId]
      || !permissions[collectionName].smartActions[smartActionId].name) {
      return endpoint;
    }

    return permissions[collectionName].smartActions[smartActionId].name;
  }

  async function retrievePermissionsAndCheckAllowed() {
    await retrievePermissions();

    const { allowed, error } = await isCollectionAllowed();

    if (!allowed) {
      throw new Error(error);
    }
  }

  this.perform = async () => {
    if (isPermissionExpired()) {
      return retrievePermissionsAndCheckAllowed();
    }

    if (!isCollectionAllowed()) {
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
