const P = require('bluebird');
const ForestServerRequester = require('./forest-server-requester');
const moment = require('moment');
const VError = require('verror');

let permissions;
let lastRetrieve;

function PermissionsChecker(environmentSecret, collectionName, permissionName) {
  const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

  function isAllowed() {
    if (!permissions || !permissions[collectionName] || !permissions[collectionName].collection) {
      return false;
    }

    return permissions[collectionName].collection[permissionName];
  }

  function retrievePermissions() {
    return new ForestServerRequester()
      .perform('/liana/v1/permissions', environmentSecret)
      .then((responseBody) => {
        permissions = responseBody;
        lastRetrieve = moment();
      })
      .catch((error) => {
        return P.reject(new VError(error, 'Permissions error'));
      });
  }

  function isPermissionExpired() {
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
  permissions = null;
};

PermissionsChecker.resetExpiration = () => {
  lastRetrieve = null;
};

PermissionsChecker.getLastRetrieveTime = () => {
  return lastRetrieve;
};

PermissionsChecker.getPermissions = () => {
  return permissions;
};

module.exports = PermissionsChecker;
