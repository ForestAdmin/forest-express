const PermissionsChecker = require('../services/permissions-checker');
const httpError = require('http-errors');
const logger = require('../services/logger');

function createCheckPermission(environmentSecret, collectionName) {
  return function checkPermission(permissionName) {
    return (request, response, next) => {
      return new PermissionsChecker(environmentSecret, collectionName, permissionName)
        .perform()
        .then(next)
        .catch((error) => {
          logger.error(error.message);
          next(httpError(403));
        });
    };
  };
}

module.exports = { createCheckPermission };
