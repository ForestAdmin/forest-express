const P = require('bluebird');
const ForestServerRequester = require('./forest-server-requester');
const moment = require('moment');
const VError = require('verror');

let permissionsList = {};

function PermissionsChecker(environmentSecret, renderingId, collectionName, permissionName) {
  const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

  function isAllowed() {
    const permissions = permissionsList[renderingId] && permissionsList[renderingId].data;

    if (!permissions || !permissions[collectionName] || !permissions[collectionName].collection) {
      return false;
    }

    return permissions[collectionName].collection[permissionName];
  }

  function retrievePermissions() {
    return new ForestServerRequester()
      .perform('/liana/v1/permissions', environmentSecret, { renderingId })
      .then((responseBody) => {
        permissionsList[renderingId] = {
          data: responseBody,
          lastRetrieve: moment(),
        };
      })
      .catch((error) => {
        return P.reject(new VError(error, 'Permissions error'));
      });
  }

  function isPermissionExpired() {
    if (!permissionsList[renderingId] || !permissionsList[renderingId].lastRetrieve) {
      return true;
    }

    const { lastRetrieve } = permissionsList[renderingId];
    const currentTime = moment();

    if (!lastRetrieve) {
      return true;
    }

    const elapsedSeconds = currentTime.diff(lastRetrieve, 'seconds');

    return elapsedSeconds >= EXPIRATION_IN_SECONDS;
  }

  function retrievePermissionsAndCheckAllowed(resolve, reject) {
    return retrievePermissions()
      .then(() => isAllowed()
        ? resolve()
        : reject(new Error(`'${permissionName}' access forbidden on ${collectionName}`)))
      .catch(reject);
  }

  this.perform = () => {
    return new P((resolve, reject) => {
      if (isPermissionExpired()) {
        return retrievePermissionsAndCheckAllowed(resolve, reject);
      }

      if (!isAllowed(collectionName, permissionName)) {
        return retrievePermissionsAndCheckAllowed(resolve, reject);
      }

      return resolve();
    });
  };
}

PermissionsChecker.cleanCache = () => {
  permissionsList = {};
};

PermissionsChecker.resetExpiration = (renderingId) => {
  const permissions = permissionsList[renderingId] && permissionsList[renderingId].data;

  if (permissions) {
    permissions.lastRetrieve = null;
  }
};

PermissionsChecker.getLastRetrieveTime = (renderingId) => {
  if (!permissionsList[renderingId]) {
    return null;
  }

  return permissionsList[renderingId].lastRetrieve;
};

PermissionsChecker.getPermissions = (renderingId) => {
  if (!permissionsList[renderingId]) {
    return null;
  }

  return permissionsList[renderingId].data;
};

module.exports = PermissionsChecker;
