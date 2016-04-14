'use strict';
var _ = require('lodash');
var ResourceSerializer = require('../serializers/resource');
var Schemas = require('../generators/schemas');
var auth = require('../services/auth');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);

  function getAssociationField(associationName) {
    var schema = Schemas.schemas[Implementation.getModelName(model)];
    var field = _.find(schema.fields, { field: associationName });
    if (field && field.reference) {
      return field.reference.split('.')[0];
    }
  }

  function index(req, res, next) {
    var params = _.extend(req.query, req.params);
    var models = Implementation.getModels();
    var associationField = getAssociationField(req.params.associationName);
    var associationModel = models[associationField];

    return new Implementation.HasManyGetter(model, associationModel, opts,
      params)
      .perform()
      .then(function (results) {
        var count = results[0];
        var records = results[1];

        return new ResourceSerializer(Implementation, associationModel,
          records, opts, { count: count }).perform();
      })
      .then(function (records) {
        res.send(records);
      })
      .catch(next);
  }

  this.perform = function () {
    app.get('/forest/' + modelName + '/:recordId/:associationName',
      auth.ensureAuthenticated, index);
  };
};
