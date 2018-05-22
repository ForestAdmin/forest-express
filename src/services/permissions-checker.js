const P = require('bluebird');
const ForestServerRequester = require('./forest-server-requester');
const moment = require('moment');

const EXPIRATION_IN_SECONDS = process.env.PREMISSIONS_EXPIRATION || 3600;
let permissions;
let lastRetrieve;

function PermissionChecker(environmentSecret, collectionName, permissionName) {
  function isAllowed() {
    if (!permissions || !permissions[collectionName] || !permissions[collectionName].permissions) {
      return false;
    }

    return permissions[collectionName].permissions[permissionName];
  }

  function retrievePermissions() {
    return new ForestServerRequester()
      .perform(environmentSecret, '/liana/v1/permissions')
      .then((responseBody) => {
        permissions = responseBody;
      })
      .catch((error) => {
        return P.reject(`Permissions: ${error}`);
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

PermissionChecker.cleanCache = () => {
  permissions = null;
};

module.exports = PermissionChecker;
