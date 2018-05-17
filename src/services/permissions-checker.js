const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const errorMessages = require('../utils/error-messages');

let permissions;

function PermissionChecker(environmentSecret, collectionName, permissionName) {
  function isAllowed() {
    console.log('isAllowed: ');
    console.log(JSON.stringify(permissions, null, 2));

    if (!permissions || !permissions[collectionName] || !permissions[collectionName].permissions) {
      return false;
    }

    return permissions[collectionName].permissions[permissionName];
  }

  function retrievePermissions() {
    const urlService = new ServiceUrlGetter().perform();

    return new P((resolve, reject) => {
      request
        .get(urlService + '/liana/permissions')
        .set('forest-secret-key', environmentSecret)
        .end(function (error, result) {
          if (error) {
            return reject(error);
          }

          // TODO: JSON API?
          if (result.status === 200 && result.body) {
            permissions = result.body;
          } else {
            if (result.status === 0) {
              // TODO: change IP_WHITELIST
              return reject(errorMessages.IP_WHITELIST.SERVER_DOWN);
            } else if (result.status === 404 || result.status === 422) {
              // TODO: change IP_WHITELIST
              return reject(errorMessages.IP_WHITELIST.SECRET_NOT_FOUND);
            } else {
              // TODO: change IP_WHITELIST
              return reject(errorMessages.IP_WHITELIST.UNEXPECTED, error);
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

module.exports = PermissionChecker;
