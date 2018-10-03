const PermissionsChecker = require('../services/permissions-checker');
const httpError = require('http-errors');
const logger = require('../services/logger');

const getRenderingFromUser = user => user.relationships.renderings.data[0].id;

function createCheckPermission(environmentSecret, collectionName, smartActionId) {
  function checkPermission(permissionName) {
    return (request, response, next) => {
      const renderingId = getRenderingFromUser(request.user);
      const endpoint = request.originalUrl;

      return new PermissionsChecker(environmentSecret, renderingId, collectionName, permissionName, smartActionId, endpoint)
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
    const renderingId = getRenderingFromUser(request.user);
    const permissionName = searchToEdit ? 'searchToEdit' : 'list';
    const endpoint = request.originalUrl;

    return new PermissionsChecker(environmentSecret, renderingId, collectionName, permissionName, smartActionId, endpoint)
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
