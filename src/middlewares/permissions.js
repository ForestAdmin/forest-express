const httpError = require('http-errors');
const PermissionsChecker = require('../services/permissions-checker');
const logger = require('../services/logger');
const context = require('../context');

const getRenderingIdFromUser = (user) => user.renderingId;

class PermissionMiddlewareCreator {
  constructor(collectionName, { configStore } = context.inject()) {
    this.collectionName = collectionName;
    this.configStore = configStore;
  }

  static _getSmartActionInfoFromRequest(request) {
    return {
      userId: request.user.id,
      actionId: request.body.data.attributes.smart_action_id,
    };
  }

  static _getCollectionListInfoFromRequest(request) {
    return { userId: request.user.id, ...request.query };
  }

  _checkPermission(permissionName) {
    return (request, response, next) => {
      const environmentSecret = this.configStore.lianaOptions.envSecret;
      const renderingId = getRenderingIdFromUser(request.user);
      let permissionInfos;
      switch (permissionName) {
        case 'actions':
          permissionInfos = PermissionMiddlewareCreator._getSmartActionInfoFromRequest(request);
          break;
        case 'list':
          permissionInfos = PermissionMiddlewareCreator._getCollectionListInfoFromRequest(request);
          break;
        default:
      }

      return new PermissionsChecker(environmentSecret, renderingId)
        .checkPermissions(this.collectionName, permissionName, permissionInfos)
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
    return this._checkPermission('actions');
  }
}

module.exports = PermissionMiddlewareCreator;
