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
      authorizationService, modelsManager,
    } = inject();

    this.modelsManager = modelsManager;

    /** @private @readonly @type {import('../services/authorization').default} */
    this.authorizationService = authorizationService;
  }

  _getSmartActionName(request) {
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

    return smartAction.name;
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

        // The implementation of ResourcesGetter uses the scopes !
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

  list() {
    return async (request, response, next) => {
      try {
        const { query: { segmentQuery = null } = {} } = request;
        await this.authorizationService
          .canBrowse(request.user, this.collectionName, segmentQuery);

        return next();
      } catch (error) {
        return next(httpError(403));
      }
    };
  }

  export() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.canExport(request.user, this.collectionName);
        return next();
      } catch (error) {
        return next(httpError(403));
      }
    };
  }

  details() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.canRead(request.user, this.collectionName);
        return next();
      } catch (error) {
        return next(httpError(403));
      }
    };
  }

  create() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.canAdd(request.user, this.collectionName);
        return next();
      } catch (error) {
        return next(httpError(403));
      }
    };
  }

  update() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.canEdit(request.user, this.collectionName);
        return next();
      } catch (error) {
        return next(httpError(403));
      }
    };
  }

  delete() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.canDelete(request.user, this.collectionName);
        next();
      } catch (error) {
        next(httpError(403));
      }
    };
  }

  smartAction() {
    return [
      async (request, response, next) => {
        try {
          const actionName = this._getSmartActionName(request);

          const approvalRequestDataWithAttributes = await this.authorizationService
            .canExecuteCustomActionAndReturnRequestBody(
              request,
              actionName,
              this.collectionName,
            );

          if (approvalRequestDataWithAttributes) {
            request.body = approvalRequestDataWithAttributes;
          }

          return next();
        } catch (error) {
          return next(httpError(403));
        }
      }, this._ensureRecordIdsInScope()];
  }

  stats() {
    return async (request, response, next) => {
      try {
        await this.authorizationService
          .canRetrieveChart(request);
        return next();
      } catch (error) {
        return next(httpError(403));
      }
    };
  }
}

module.exports = PermissionMiddlewareCreator;
