const { inject } = require('@forestadmin/context');
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
          .assertCanBrowse(request.user, this.collectionName, segmentQuery);

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  export() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.assertCanExport(request.user, this.collectionName);
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  details() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.assertCanRead(request.user, this.collectionName);
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  create() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.assertCanAdd(request.user, this.collectionName);
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  update() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.assertCanEdit(request.user, this.collectionName);
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  delete() {
    return async (request, response, next) => {
      try {
        await this.authorizationService.assertCanDelete(request.user, this.collectionName);
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  smartAction() {
    return [
      async (request, response, next) => {
        try {
          const actionName = this._getSmartActionName(request);
          const requestBody = request.body;

          if (requestBody?.data?.attributes?.signed_approval_request) {
            const signedParameters = this.authorizationService.verifySignedActionParameters(
              requestBody?.data?.attributes?.signed_approval_request,
            );
            await this.authorizationService.assertCanApproveCustomAction({
              user: request.user,
              customActionName: actionName,
              collectionName: this.collectionName,
              requesterId: signedParameters?.data?.attributes?.requester_id,
            });
            request.body = signedParameters;
          } else {
            await this.authorizationService.assertCanTriggerCustomAction({
              user: request.user,
              customActionName: actionName,
              collectionName: this.collectionName,
            });
          }

          next();
        } catch (error) {
          next(error);
        }
      }, this._ensureRecordIdsInScope()];
  }

  stats() {
    return async (request, response, next) => {
      try {
        await this.authorizationService
          .assertCanRetrieveChart({
            user: request.user,
            chartRequest: request.body,
          });
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = PermissionMiddlewareCreator;
