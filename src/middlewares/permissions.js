const PermissionsChecker = require('../services/permissions-checker');
const httpError = require('http-errors');
const logger = require('../services/logger');

// TODO: add verror
function createCheckPermission(environmentSecret, collectionName) {
  return function checkPermission(permissionName) {
    return (request, response, next) => {
      return new PermissionsChecker(environmentSecret, collectionName, permissionName)
        .perform()
        .then(next)
        .catch((error) => {
          logger.error(error);
          next(httpError(403));
        });
    };
  };
}

module.exports = { createCheckPermission };
