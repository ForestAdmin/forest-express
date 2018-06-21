const P = require('bluebird');
const ForestServerRequester = require('./forest-server-requester');
const moment = require('moment');
const VError = require('verror');

let permissionsPerRendering = {};

function PermissionsChecker(environmentSecret, renderingId, collectionName, permissionName) {
  const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

  function isAllowed() {
    const permissions =
      permissionsPerRendering[renderingId] && permissionsPerRendering[renderingId].data;

    if (!permissions || !permissions[collectionName] || !permissions[collectionName].collection) {
      return false;
    }

    return permissions[collectionName].collection[permissionName];
  }

  function retrievePermissions() {
    return new ForestServerRequester()
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
