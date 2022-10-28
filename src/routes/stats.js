const { inject } = require('@forestadmin/context');
const _ = require('lodash');
const auth = require('../services/auth');
const logger = require('../services/logger');
const error = require('../utils/error');
const path = require('../services/path');
const StatSerializer = require('../serializers/stat');
const PermissionMiddlewareCreator = require('../middlewares/permissions');
const Schemas = require('../generators/schemas');

const CHART_TYPE_VALUE = 'Value';
const CHART_TYPE_PIE = 'Pie';
const CHART_TYPE_LINE = 'Line';
const CHART_TYPE_LEADERBOARD = 'Leaderboard';
const CHART_TYPE_OBJECTIVE = 'Objective';

module.exports = function Stats(app, model, Implementation, opts) {
  const { chartHandler, modelsManager } = inject();
  const modelName = Implementation.getModelName(model);
  const permissionMiddlewareCreator = new PermissionMiddlewareCreator(modelName);

  this.get = async (request, response, next) => {
    let promise = null;

    function getAssociationModel(schema, associationName) {
      const field = _.find(schema.fields, { field: associationName });
      let relatedModelName;
      if (field && field.reference) {
        [relatedModelName] = field.reference.split('.');
      }

      const models = modelsManager.getModels();
      return _.find(
        models,
        (currentModel) => Implementation.getModelName(currentModel) === relatedModelName,
      );
    }

    const chart = await chartHandler.getChart({
      userId: request.user.id,
      renderingId: request.user.renderingId,
      chartRequest: request.body,
    });
    const params = { timezone: request.query.timezone, ...request.body, ...chart };
    const { type } = request.body;

    if (type === CHART_TYPE_LEADERBOARD) {
      const schema = Schemas.schemas[model.name];
      const modelRelationship = getAssociationModel(schema, request.body.relationshipFieldName);

      promise = new Implementation
        .LeaderboardStatGetter(model, modelRelationship, params, request.user).perform();
    } else {
      // Objective chart uses a value stat getter to retrieve the value.
      const statGetterType = type === CHART_TYPE_OBJECTIVE ? CHART_TYPE_VALUE : type;

      promise = new Implementation[`${statGetterType}StatGetter`](model, params, opts, request.user).perform();
    }

    if (!promise) {
      return response.status(400).send({ error: 'Chart type not found.' });
    }

    return promise
      .then((stat) => {
        if (type === CHART_TYPE_OBJECTIVE) {
          stat.value.value = stat.value.countCurrent;
          delete stat.value.countCurrent;
          delete stat.value.countPrevious;
        }

        return new StatSerializer(stat).perform();
      })
      .then((stat) => { response.send(stat); })
      .catch(next);
  };

  function getErrorQueryColumnsName(result, keyNames) {
    const message = `The result columns must be named ${keyNames} instead of '${
      Object.keys(result).join('\', \'')}'.`;
    logger.error(`Live Query error: ${message}`);
    return new error.UnprocessableEntity(message);
  }

  this.getWithLiveQuery = (request, response, next) =>
    new Implementation.QueryStatGetter(request.body, opts)
      .perform()
      .then((result) => {
        switch (request.body.type) {
          case CHART_TYPE_VALUE:
            if (result.length) {
              const resultLine = result[0];
              if (resultLine.value === undefined) {
                throw getErrorQueryColumnsName(resultLine, '\'value\'');
              } else {
                result = {
                  countCurrent: resultLine.value,
                  countPrevious: resultLine.previous,
                };
              }
            }
            break;
          case CHART_TYPE_PIE:
          case CHART_TYPE_LEADERBOARD:
            if (result.length) {
              result.forEach((resultLine) => {
                if (resultLine.value === undefined || resultLine.key === undefined) {
                  throw getErrorQueryColumnsName(resultLine, '\'key\', \'value\'');
                }
              });
            }
            break;
          case CHART_TYPE_LINE:
            if (result.length) {
              result.forEach((resultLine) => {
                if (resultLine.value === undefined || resultLine.key === undefined) {
                  throw getErrorQueryColumnsName(resultLine, '\'key\', \'value\'');
                }
              });
            }

            result = result.map((resultLine) => ({
              label: resultLine.key,
              values: {
                value: resultLine.value,
              },
            }));
            break;
          case CHART_TYPE_OBJECTIVE:
            if (result.length) {
              const resultLine = result[0];
              if (resultLine.value === undefined || resultLine.objective === undefined) {
                throw getErrorQueryColumnsName(resultLine, '\'value\', \'objective\'');
              } else {
                result = {
                  objective: resultLine.objective,
                  value: resultLine.value,
                };
              }
            }
            break;
          default:
            throw new Error('Unknown Chart type');
        }

        return new StatSerializer({ value: result }).perform();
      })
      .then((data) => { response.send(data); })
      .catch(next);

  this.perform = () => {
    app.post(path.generate(`stats/${modelName}`, opts), auth.ensureAuthenticated, permissionMiddlewareCreator.stats(), this.get);
    app.post(path.generate('stats', opts), auth.ensureAuthenticated, permissionMiddlewareCreator.stats(), this.getWithLiveQuery);
  };
};
