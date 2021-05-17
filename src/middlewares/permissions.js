const httpError = require('http-errors');
const { parameterize } = require('../utils/string');
const context = require('../context');
const Schemas = require('../generators/schemas');
const QueryDeserializer = require('../deserializers/query');
const RecordsCounter = require('../services/exposed/records-counter');

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
    const smartActionEndpoint = `${request.baseUrl}${request.path}`;
    const smartActionHTTPMethod = request.method;
    const smartAction = Schemas.schemas[this.collectionName].actions.find((action) => {
      const endpoint = action.endpoint || `/actions/${parameterize(action.name)}`;
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

  static _getRequestAttributes(request) {
    const hasBodyAttributes = request.body && request.body.data && request.body.data.attributes;
    return hasBodyAttributes
      && new QueryDeserializer(request.body.data.attributes).perform();
  }

  // Generat a middleware that will check that ids provided by the request exist
  // whithin the registered scope
  _ensureRecordIdsInScope(model) {
    if (!model) throw new Error('missing model');

    return async (request, response, next) => {
      const attributes = PermissionMiddlewareCreator._getRequestAttributes(request);

      // if performing a `selectAll` let the `getIdsFromRequest` handle the scopes
      if (attributes.allRecords) return next();

      const modelName = this.configStore.Implementation.getModelName(model);
      const { idField } = Schemas.schemas[modelName];

      // TODO: scope smartAction calls properly on table with composite primary keys
      if (idField === 'forestCompositePrimary') return next();

      const tragetRecordIds = attributes.ids;
      const checkIdsFilter = JSON.stringify({
        field: idField,
        operator: 'in',
        value: tragetRecordIds,
      });

      // count records matching the provided filters (with scopes applied by the RecordCounter)
      const count = await new RecordsCounter(
        model, request.user, { filters: checkIdsFilter, timezone: 'Europe/Paris' },
      ).count();

      // some record ids are outside of scope
      if (count !== tragetRecordIds.length) {
        return response.status(400).send({ error: 'Smart Action: target records are out of scope' });
      }

      return next();
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

  smartAction(model) {
    return [this._checkPermission('actions'), this._ensureRecordIdsInScope(model)];
  }

  liveQueries() {
    return this._checkPermission('liveQueries');
  }

  statWithParameters() {
    return this._checkPermission('statWithParameters');
  }
}

module.exports = PermissionMiddlewareCreator;
