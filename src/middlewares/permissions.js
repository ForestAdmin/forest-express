const PermissionsChecker = require('../services/permissions-checker');
const httpError = require('http-errors');
const logger = require('../services/logger');

function createCheckPermissionList(environmentSecret, collectionName) {
  return function checkPermissionList(request, response, next) {
    return new PermissionsChecker(environmentSecret, collectionName, 'list')
      .perform()
      .then(next)
      .catch((error) => {
        logger.error(error);
        next(httpError(403));
      });
  };
}

module.exports = { createCheckPermissionList };
