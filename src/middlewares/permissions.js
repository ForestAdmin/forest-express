const PermissionsChecker = require('../services/permissions-checker');
const logger = require('../services/logger');
const ErrorSender = require('../services/error-sender');

const getRenderingFromUser = user => user.relationships.renderings.data[0].id;

function createCheckPermission(environmentSecret, collectionName) {
  function checkPermission(permissionName, smartActionId = null) {
    return (request, response, next) => {
      const renderingId = getRenderingFromUser(request.user);
      const httpMethod = request.method;
      const endpoint = request.originalUrl;

      return new PermissionsChecker(
        environmentSecret,
        renderingId,
        collectionName,
        permissionName,
        smartActionId,
        httpMethod,
        endpoint
      )
        .perform()
        .then(next)
        .catch((error) => {
          logger.error(error.message);
          new ErrorSender(response, error)
            .sendForbidden();
        });
    };
  }

  function checkPermissionListAndSearch(request, response, next) {
    const { searchToEdit } = request.query;
    const renderingId = getRenderingFromUser(request.user);
    const permissionName = searchToEdit ? 'searchToEdit' : 'list';

    return new PermissionsChecker(environmentSecret, renderingId, collectionName, permissionName)
      .perform()
      .then(next)
      .catch((error) => {
        logger.error(error.message);
        new ErrorSender(response, error)
          .sendForbidden();
      });
  }

  return {
    checkPermission,
    checkPermissionListAndSearch,
  };
}

module.exports = { createCheckPermission };
