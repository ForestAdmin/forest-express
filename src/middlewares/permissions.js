const httpError = require('http-errors');
const { parameterize } = require('../utils/string');
const PermissionsChecker = require('../services/permissions-checker');
const logger = require('../services/logger');
const ConfigStore = require('../services/config-store');
const Schemas = require('../generators/schemas');

const getRenderingIdFromUser = (user) => user.renderingId;

class PermissionMiddlewareCreator {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.configStore = ConfigStore.getInstance();
  }

  _getSmartActionInfoFromRequest(request) {
    const smartActionEndpoint = request.originalUrl;
    const smartActionHTTPMethod = request.method;
    const smartAction = Schemas.schemas[this.collectionName].actions.find((action) => {
      const endpoint = action.endpoint || `/forest/actions/${parameterize(action.name)}`;
      const method = action.httpMethod || 'POST';
      return (endpoint === smartActionEndpoint && method === smartActionHTTPMethod);
    });
    return {
      userId: request.user.id,
      actionName: smartAction.name,
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
          permissionInfos = this._getSmartActionInfoFromRequest(request);
          break;
        case 'browseEnabled':
          permissionInfos = PermissionMiddlewareCreator._getCollectionListInfoFromRequest(request);
          break;
        default:
          permissionInfos = { userId: request.user.id };
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
    return this._checkPermission('browseEnabled');
  }

  export() {
    return this._checkPermission('exportEnabled');
  }

  details() {
    return this._checkPermission('readEnabled');
  }

  create() {
    return this._checkPermission('createEnabled');
  }

  update() {
    return this._checkPermission('updateEnabled');
  }

  delete() {
    return this._checkPermission('deleteEnabled');
  }

  smartAction() {
    return this._checkPermission('actions');
  }
}

module.exports = PermissionMiddlewareCreator;
