const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const errorMessages = require('../utils/error-messages');

let permissions;

function PermissionChecker(environmentSecret, collectionName, permissionName) {
  function isAllowed() {
    if (!permissions || !permissions[collectionName] || !permissions[collectionName].permissions) {
      return false;
    }

    return permissions[collectionName].permissions[permissionName];
  }

  function retrievePermissions() {
    const urlService = new ServiceUrlGetter().perform();

    return new P((resolve, reject) => {
      request
        .get(urlService + '/liana/v1/permissions')
        .set('forest-secret-key', environmentSecret)
        .end(function (error, result) {
          if (error) {
            return reject(error);
          }

          if (result.status === 200 && result.body) {
            permissions = result.body;
          } else {
            if (result.status === 0) {
              return reject(errorMessages.SERVER_TRANSACTION.SERVER_DOWN);
            } else if (result.status === 404 || result.status === 422) {
              return reject(errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND);
            } else {
              return reject(errorMessages.SERVER_TRANSACTION.UNEXPECTED, error);
            }
          }
          resolve();
        });
    });
  }

  this.perform = () => {
    return new P((resolve, reject) => {
      if (!isAllowed(collectionName, permissionName)) {
        return retrievePermissions()
          .then(() => isAllowed()
            ? resolve()
            : reject(new Error(`'${permissionName}' access forbidden on ${collectionName}`)));
      }

      return resolve();
    });
  };
}

PermissionChecker.cleanCache = () => {
  permissions = null;
};

module.exports = PermissionChecker;
