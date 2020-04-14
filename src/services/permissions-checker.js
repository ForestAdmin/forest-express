const P = require('bluebird');
const moment = require('moment');
const VError = require('verror');
const forestServerRequester = require('./forest-server-requester');

let permissionsPerRendering = {};

function PermissionsChecker(
  environmentSecret,
  renderingId,
  collectionName,
  permissionName,
  smartActionParameters = undefined,
) {
  const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

  function isSmartActionAllowed(smartActionsPermissions) {
    if (!smartActionParameters
      || !smartActionParameters.userId
      || !smartActionParameters.actionId
      || !smartActionsPermissions
      || !smartActionsPermissions[smartActionParameters.actionId]) {
      return false;
    }

    const { userId, actionId } = smartActionParameters;
    const { allowed, users } = smartActionsPermissions[actionId];

    return allowed && (!users || users.includes(parseInt(userId, 10)));
  }

  function isAllowed() {
    const permissions = permissionsPerRendering[renderingId]
      && permissionsPerRendering[renderingId].data;

    if (!permissions || !permissions[collectionName] || !permissions[collectionName].collection) {
      return false;
    }

    if (permissionName === 'smart action') {
      return isSmartActionAllowed(permissions[collectionName].actions);
    }
    return permissions[collectionName].collection[permissionName];
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
      .catch((error) => P.reject(new VError(error, 'Permissions error')));
  }

  function isPermissionExpired() {
    if (!permissionsPerRendering[renderingId]
      || !permissionsPerRendering[renderingId].lastRetrieve) {
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

  function retrievePermissionsAndCheckAllowed(resolve, reject) {
    return retrievePermissions()
      .then(() => (isAllowed()
        ? resolve()
        : reject(new Error(`'${permissionName}' access forbidden on ${collectionName}`))))
      .catch(reject);
  }

  this.perform = () =>
    new P((resolve, reject) => {
      if (isPermissionExpired()) {
        return retrievePermissionsAndCheckAllowed(resolve, reject);
      }

      if (!isAllowed(collectionName, permissionName)) {
        return retrievePermissionsAndCheckAllowed(resolve, reject);
      }

      return resolve();
    });
}

PermissionsChecker.cleanCache = () => {
  permissionsPerRendering = {};
};

PermissionsChecker.resetExpiration = (renderingId) => {
  const permissions = permissionsPerRendering[renderingId]
    && permissionsPerRendering[renderingId].data;

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
