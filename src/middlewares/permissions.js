const httpError = require('http-errors');
const { parameterize } = require('../utils/string');
const context = require('../context');
const Schemas = require('../generators/schemas');

const getRenderingIdFromUser = (user) => user.renderingId;

class PermissionMiddlewareCreator {
  constructor(collectionName) {
    this.collectionName = collectionName;
    const { configStore, logger, permissionsChecker } = context.inject();
    this.logger = logger;
    this.permissionsChecker = permissionsChecker;
    this.configStore = configStore;
  }

  _getSmartActionInfoFromRequest(request) {
    const smartActionEndpoint = request.originalUrl;
    const smartActionHTTPMethod = request.method;
    const smartAction = Schemas.schemas[this.collectionName].actions.find((action) => {
      const endpoint = action.endpoint || `/forest/actions/${parameterize(action.name)}`;
      const method = action.httpMethod || 'POST';
      return endpoint === smartActionEndpoint && method === smartActionHTTPMethod;
    });

    if (!smartAction) {
      throw new Error(`Impossible to retrieve the smart action at endpoint ${smartActionEndpoint} and method ${smartActionHTTPMethod}`);
    }

    return {
      userId: request.user.id,
      actionName: smartAction.name,
    };
  }

  static _getCollectionListInfoFromRequest(request) {
    return { userId: request.user.id, ...request.query };
  }

  static _getLiveQueriesInfoFromRequest(request) {
    const { query } = request.body;
    return query;
  }

  static _getStatWithParametersInfoFromRequest(request) {
    const parameters = { ...request.body };
    // NOTICE: Remove useless information
    delete parameters.timezone;

    // NOTICE: Remove the field information from group_by_field => collection:id
    if (parameters.group_by_field) {
      [parameters.group_by_field] = parameters.group_by_field.split(':');
    }

    return parameters;
  }

  _getPermissionsInfo(permissionName, request) {
    switch (permissionName) {
      case 'actions':
        return this._getSmartActionInfoFromRequest(request);
      case 'browseEnabled':
        return PermissionMiddlewareCreator._getCollectionListInfoFromRequest(request);
      case 'liveQueries':
        return PermissionMiddlewareCreator._getLiveQueriesInfoFromRequest(request);
      case 'statWithParameters':
        return PermissionMiddlewareCreator._getStatWithParametersInfoFromRequest(request);

      default:
        return { userId: request.user.id };
    }
  }

  _checkPermission(permissionName) {
    return async (request, response, next) => {
      const renderingId = getRenderingIdFromUser(request.user);
      const permissionInfos = this._getPermissionsInfo(permissionName, request);

      const environmentId = this.configStore.lianaOptions.multiplePermissionsCache
        ? this.configStore.lianaOptions.multiplePermissionsCache.getEnvironmentId(request)
        : null;
      try {
        await this.permissionsChecker.checkPermissions(
          renderingId, this.collectionName, permissionName, permissionInfos, environmentId,
        );
        next();
      } catch (error) {
        this.logger.error(error);
        next(httpError(403));
      }
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
    return this._checkPermission('addEnabled');
  }

  update() {
    return this._checkPermission('editEnabled');
  }

  delete() {
    return this._checkPermission('deleteEnabled');
  }

  smartAction() {
    return this._checkPermission('actions');
  }

  liveQueries() {
    return this._checkPermission('liveQueries');
  }

  statWithParameters() {
    return this._checkPermission('statWithParameters');
  }
}

module.exports = PermissionMiddlewareCreator;
