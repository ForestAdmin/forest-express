const P = require('bluebird');
const ForestServerRequester = require('./forest-server-requester');

let permissions;

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

  this.perform = () => {
    return new P((resolve, reject) => {
      if (!isAllowed(collectionName, permissionName)) {
        return retrievePermissions()
          .then(() => isAllowed()
            ? resolve()
            : reject(new Error(`'${permissionName}' access forbidden on ${collectionName}`)))
          .catch(reject);
      }

      return resolve();
    });
  };
}

PermissionChecker.cleanCache = () => {
  permissions = null;
};

module.exports = PermissionChecker;
