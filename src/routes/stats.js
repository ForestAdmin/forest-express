'use strict';
var _ = require('lodash');
var auth = require('../services/auth');
var logger = require('../services/logger');
var error = require('../services/error');
var path = require('../services/path');
var StatSerializer = require('../serializers/stat');
var Schemas = require('../generators/schemas');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);

  this.get = function (request, response, next) {
    var promise = null;

    function getAssociationModel(schema, associationName) {
      const field = _.find(schema.fields, { field: associationName });
      let relatedModelName;
      if (field && field.reference) {
        relatedModelName = field.reference.split('.')[0];
      }

      const models = Implementation.getModels();
      return _.find(models, model => Implementation.getModelName(model) === relatedModelName);
    }

    let { type } = request.body;
    if (type === 'Objective') { type = 'Value'; }

    if (type === 'Leaderboard') {
      const schema = Schemas.schemas[model.name];
      const modelRelationship = getAssociationModel(schema, request.body.relationship_field);

      promise = new Implementation
        .LeaderboardStatGetter(model, modelRelationship, request.body, opts).perform();
    } else {
      promise = new Implementation[`${type}StatGetter`](model, request.body, opts).perform();
    }

    if (!promise) {
      return response.status(400).send({ error: 'Chart type not found.' });
    }

    promise
      .then(function (stat) {
        return new StatSerializer(stat).perform();
      })
      .then(function (stat) { response.send(stat); })
      .catch(next);
  };

  function getErrorQueryColumnsName(result, keyNames) {
    var message = 'The result columns must be named ' + keyNames + ' instead of \'' +
      Object.keys(result).join('\', \'') + '\'.';
    logger.error('Live Query error: ' + message);
    return new error.UnprocessableEntity(message);
  }

  this.getWithLiveQuery = function (request, response, next) {
    return new Implementation.QueryStatGetter(request.body, opts)
      .perform()
      .then(function (result) {
        switch (request.body.type) {
        case 'Value':
          if (result.length) {
            var resultLine = result[0];
            if (resultLine.value === undefined) {
              throw getErrorQueryColumnsName(resultLine, '\'value\'');
            } else {
              result = {
                countCurrent: resultLine.value,
                countPrevious: resultLine.previous
              };
            }
          }
          break;
        case 'Pie':
        case 'Leaderboard':
          if (result.length) {
            result.forEach(function (resultLine) {
              if (resultLine.value === undefined || resultLine.key === undefined) {
                throw getErrorQueryColumnsName(resultLine, '\'key\', \'value\'');
              }
            });
          }
          break;
        case 'Line':
          if (result.length) {
            result.forEach(function (resultLine) {
              if (resultLine.value === undefined || resultLine.key === undefined) {
                throw getErrorQueryColumnsName(resultLine, '\'key\', \'value\'');
              }
            });
          }

          result = result.map(function (resultLine) {
            return {
              label: resultLine.key,
              values: {
                value: resultLine.value,
              },
            };
          });
          break;
        case 'Objective':
          if (result.length) {
            let resultLine = result[0];
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
        }

        return new StatSerializer({ value: result }).perform();
      })
      .then(function (data) { response.send(data); })
      .catch(next);
  };

  this.perform = function () {
    app.post(path.generate('stats/' + modelName, opts), auth.ensureAuthenticated, this.get);
    app.post(path.generate('stats', opts), auth.ensureAuthenticated, this.getWithLiveQuery);
  };
};
