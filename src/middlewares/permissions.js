const httpError = require('http-errors');
const PermissionsChecker = require('../services/permissions-checker');
const logger = require('../services/logger');
const ConfigStore = require('../services/config-store');

const getRenderingIdFromUser = (user) => user.renderingId;

class PermissionMiddlewareCreator {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.configStore = ConfigStore.getInstance();
  }

  static _getSmartActionInfoFromRequest(request) {
    return {
      userId: request.user.id,
      actionId: request.body.data.attributes.smart_action_id,
    };
  }

  _checkPermission(permissionName) {
    return (request, response, next) => {
      const environmentSecret = this.configStore.lianaOptions.envSecret;
      const renderingId = getRenderingIdFromUser(request.user);
      let smartActionInfo;

      if (permissionName === 'smart action') {
        smartActionInfo = PermissionMiddlewareCreator._getSmartActionInfoFromRequest(request);
      }

      return new PermissionsChecker(
        environmentSecret,
        renderingId,
        this.collectionName,
        permissionName,
        smartActionInfo,
      )
        .perform()
        .then(next)
        .catch((error) => {
          logger.error(error.message);
          next(httpError(403));
        });
    };
  }

  list() {
    return (request, response, next) => {
      const { searchToEdit } = request.query;
      const permissionName = searchToEdit ? 'searchToEdit' : 'list';

      return this._checkPermission(permissionName)(request, response, next);
    };
  }

  export() {
    return this._checkPermission('export');
  }

  details() {
    return this._checkPermission('show');
  }

  create() {
    return this._checkPermission('create');
  }

  update() {
    return this._checkPermission('update');
  }

  delete() {
    return this._checkPermission('delete');
  }

  smartAction() {
    return this._checkPermission('smart action');
  }
}

module.exports = PermissionMiddlewareCreator;
