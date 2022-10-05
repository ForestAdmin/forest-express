const { inject } = require('@forestadmin/context');
const httpError = require('http-errors');
const { parameterize } = require('../utils/string');
const Schemas = require('../generators/schemas');
const QueryDeserializer = require('../deserializers/query');
const RecordsCounter = require('../services/exposed/records-counter');

class PermissionMiddlewareCreator {
  constructor(collectionName) {
    this.collectionName = collectionName;
    const {
      configStore, logger, forestAdminClient, modelsManager,
    } = inject();

    this.logger = logger;
    this.configStore = configStore;
    this.modelsManager = modelsManager;

    /** @private @readonly @type {import('../types/types').IForestAdminClient} */
    this.forestAdminClient = forestAdminClient;
  }

  _getSmartActionInfoFromRequest(request) {
    const smartActionEndpoint = `${request.baseUrl}${request.path}`;
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

  // generate a middleware that will check that ids provided by the request exist
  // whithin the registered scope
  _ensureRecordIdsInScope() {
    return async (request, response, next) => {
      try {
        const { primaryKeys, isVirtual } = Schemas.schemas[this.collectionName];

        // Smart collections does not have the scope feature
        if (isVirtual) {
          return next();
        }

        // if performing a `selectAll` let the `getIdsFromRequest` handle the scopes
        const hasBodyAttributes = request.body && request.body.data && request.body.data.attributes;
        const attributes = hasBodyAttributes
      && new QueryDeserializer(request.body.data.attributes).perform();
        if (attributes.allRecords) {
          return next();
        }

        // Otherwise, check that all records are within scope.
        const filters = JSON.stringify(primaryKeys.length === 1
          ? { field: primaryKeys[0], operator: 'in', value: attributes.ids }
          : {
            aggregator: 'or',
            conditions: attributes.ids.map((compositeId) => ({
              aggregator: 'and',
              conditions: compositeId.split('|').map((id, index) => ({
                field: primaryKeys[index], operator: 'equal', value: id,
              })),
            })),
          });

        const counter = new RecordsCounter(
          this.modelsManager.getModelByName(this.collectionName),
          request.user,
          { filters, timezone: request.query.timezone },
        );

        if (await counter.count() === attributes.ids.length) {
          return next();
        }

        return response.status(400).send({ error: 'Smart Action: target records are out of scope' });
      } catch {
        return response.status(500).send({ error: 'Smart Action: failed to evaluate permissions' });
      }
    };
  }

  static _ensureSegment(segments, segmentQuery) {
    // NOTICE: Security - Segment Query check additional permission
    if (segmentQuery) {
      // NOTICE: The segmentQuery should be in the segments
      if (!segments) {
        return false;
      }

      // NOTICE: Handle UNION queries made by the FRONT to display available actions on details view
      const unionQueries = segmentQuery.split('/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION ');
      if (unionQueries.length > 1) {
        const includesAllowedQueriesOnly = unionQueries
          .every((unionQuery) => segments.filter((query) => query.replace(/;\s*/i, '') === unionQuery).length > 0);
        if (!includesAllowedQueriesOnly) {
          return false;
        }
      } else if (!segments.includes(segmentQuery)) {
        return false;
      }
    }
    return true;
  }

  list() {
    return async (request, response, next) => {
      // Do we have this information today ?
      const segments = null;
      try {
        const { segmentQuery } = request.query;

        if (
          PermissionMiddlewareCreator._ensureSegment(segments, segmentQuery)
          && (await this.forestAdminClient.canBrowse(request.user.id, this.collectionName))
        ) {
          throw new Error();
        }
        next();
      } catch (error) {
        this.logger.error(error.message);
        next(httpError(403));
      }
    };
  }

  export() {
    return async (request, response, next) => {
      try {
        await this.forestAdminClient.canExport(request.user.id, this.collectionName);
        next();
      } catch (error) {
        this.logger.error(error.message);
        next(httpError(403));
      }
    };
  }

  details() {
    return async (request, response, next) => {
      try {
        await this.forestAdminClient.canRead(request.user.id, this.collectionName);
        next();
      } catch (error) {
        this.logger.error(error.message);
        next(httpError(403));
      }
    };
  }

  create() {
    return async (request, response, next) => {
      try {
        await this.forestAdminClient.canAdd(request.user.id, this.collectionName);
        next();
      } catch (error) {
        this.logger.error(error.message);
        next(httpError(403));
      }
    };
  }

  update() {
    return async (request, response, next) => {
      try {
        await this.forestAdminClient.canEdit(request.user.id, this.collectionName);
        next();
      } catch (error) {
        this.logger.error(error.message);
        next(httpError(403));
      }
    };
  }

  delete() {
    return async (request, response, next) => {
      try {
        await this.forestAdminClient.canDelete(request.user.id, this.collectionName);
        next();
      } catch (error) {
        this.logger.error(error.message);
        next(httpError(403));
      }
    };
  }

  smartAction() {
    return [async (request, response, next) => {
      const { userId, actionName } = this._getSmartActionInfoFromRequest(request);
      try {
        await this.forestAdminClient
          .canExecuteCustomAction(userId, actionName, this.collectionName);
        next();
      } catch (error) {
        this.logger.error(error.message);
        next(httpError(403));
      }
    }, this._ensureRecordIdsInScope()];
  }

  stats() {
    return async (request, response, next) => {
      const { body: chartRequest } = request;
      const { renderingId } = chartRequest;

      try {
        await this.forestAdminClient
          .canRetrieveChart({ renderingId, userId: request.user.id, chartRequest });
        next();
      } catch (error) {
        this.logger.error(error.message);
        next(httpError(403));
      }
    };
  }
}

module.exports = PermissionMiddlewareCreator;
