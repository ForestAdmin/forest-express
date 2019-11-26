const _ = require('lodash');
const { parameterize } = require('../utils/string');
const auth = require('../services/auth');
const path = require('../services/path');
const logger = require('../services/logger');
const Schemas = require('../generators/schemas');

module.exports = function Actions(app, model, Implementation, integrator, options) {
  const modelName = Implementation.getModelName(model);
  const schema = Schemas.schemas[modelName];

  function getFormValuesController(action) {
    return (request, response) => {
      let values = action.values ? action.values(request.body.data.attributes.values) : {};

      if (_.isFunction(values.then)) {
        return values
          .then((valuesComputed) => {
            values = valuesComputed;
          })
          .catch((error) => {
            logger.error(`Cannot send the values of the "${action.name}" Smart Actions because of an unexpected error: ${error}`);
            values = {};
          })
          .finally(() => response.status(200).send(values));
      }

      return response.status(200).send(values);
    };
  }

  this.perform = () => {
    _.each(schema.actions, (action) => {
      if (action.values) {
        let route;

        if (action.endpoint) {
          route = path.generateForSmartActionCustomEndpoint(`${action.endpoint}/values`, options);
        } else {
          route = path.generate(`actions/${parameterize(action.name)}/values`, options);
        }

        app.post(route, auth.ensureAuthenticated, getFormValuesController(action));
      }
    });
  };
};
