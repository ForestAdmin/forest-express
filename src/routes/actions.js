const _ = require('lodash');
const Inflector = require('inflected');
const auth = require('../services/auth');
const path = require('../services/path');
const logger = require('../services/logger');
const Schemas = require('../generators/schemas');

module.exports = function (app, model, Implementation, integrator, options) {
  const modelName = Implementation.getModelName(model);
  const schema = Schemas.schemas[modelName];

  function getFormValuesController (action) {
    return function (request, response) {
      var values = action.values ? action.values(request.body.data.attributes.values) : {};

      if (_.isFunction(values.then)) {
        return values
          .then(function (valuesComputed) {
            values = valuesComputed;
          })
          .catch(function (error) {
            logger.error('Cannot send the values of the "' + action.name + '" Smart Actions ' +
              'because of an unexpected error: ' + error);
            values = {};
          })
          .finally(function () {
            return response.status(200).send(values);
          });
      }

      return response.status(200).send(values);
    };
  }

  this.perform = function () {
    _.each(schema.actions, (action) => {
      if (action.values) {
        let route;

        if (action.endpoint) {
          route = path.generateForSmartActionCustomEndpoint(`${action.endpoint}/values`, options);
        } else {
          route = path.generate(`actions/${Inflector.parameterize(action.name)}/values`, options);
        }

        app.post(route, auth.ensureAuthenticated, getFormValuesController(action));
      }
    });
  };
};
