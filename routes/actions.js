'use strict';
var _ = require('lodash');
var Inflector = require('inflected');
var auth = require('../services/auth');
var path = require('../services/path');
var logger = require('../services/logger');
var Schemas = require('../generators/schemas');

module.exports = function (app, model, Implementation, integrator, options) {
  var modelName = Implementation.getModelName(model);
  var schema = Schemas.schemas[modelName];

  function getFormValuesController (action) {
    return function (request, response) {
      var values = action.values(request.body.data.attributes.values);

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
    // NOTICE: HasMany associations routes
    _.each(schema.actions, function (action) {
      if (action.values) {
        var endpoint = action.endpoint || 'actions/' + Inflector.parameterize(action.name);
        app.post(path.generate(endpoint + '/values', options), auth.ensureAuthenticated,
          getFormValuesController(action));
      }
    });
  };
};
