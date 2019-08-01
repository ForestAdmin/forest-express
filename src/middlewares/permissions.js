const PermissionsChecker = require('../services/permissions-checker');
const httpError = require('http-errors');
const logger = require('../services/logger');

const getRenderingIdFromUser = user => user.renderingId;

function createCheckPermission(environmentSecret, collectionName) {
  function checkPermission(permissionName) {
    return (request, response, next) => {
      const renderingId = getRenderingIdFromUser(request.user);

      return new PermissionsChecker(environmentSecret, renderingId, collectionName, permissionName)
        .perform()
        .then(next)
        .catch((error) => {
          logger.error(error.message);
          next(httpError(403));
        });
    };
  }

  function checkPermissionListAndSearch(request, response, next) {
    const { searchToEdit } = request.query;
    const renderingId = getRenderingIdFromUser(request.user);
    const permissionName = searchToEdit ? 'searchToEdit' : 'list';

    return new PermissionsChecker(environmentSecret, renderingId, collectionName, permissionName)
      .perform()
      .then(next)
      .catch((error) => {
        logger.error(error.message);
        next(httpError(403));
      });
  }

  return {
    checkPermission,
    checkPermissionListAndSearch,
  };
}

module.exports = { createCheckPermission };
