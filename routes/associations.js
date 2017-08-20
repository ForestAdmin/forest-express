'use strict';
var _ = require('lodash');
var P = require('bluebird');
var SchemaUtil = require('../utils/schema');
var auth = require('../services/auth');
var path = require('../services/path');
var ResourceSerializer = require('../serializers/resource');
var Schemas = require('../generators/schemas');
var SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');
var CSVExporter = require('../services/csv-exporter');

module.exports = function (app, model, Implementation, integrator, opts) {
  var modelName = Implementation.getModelName(model);
  var schema = Schemas.schemas[modelName];

  function getAssociationField(associationName) {
    var field = _.find(schema.fields, { field: associationName });
    if (field && field.reference) {
      return field.reference.split('.')[0];
    }
  }

  function getAssociation(request) {
    return {
      associationName:
         _.first(_.last(request.route.path.split('/')).split('.csv'))
    };
  }

  function index(request, response, next) {
    var association = getAssociation(request);
    var params = _.extend(request.query, request.params, association);
    var models = Implementation.getModels();
    var associationField = getAssociationField(params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });

    return new Implementation.HasManyGetter(model, associationModel, opts,
      params)
      .perform()
      .then(function (results) {
        var count = results[0];
        var records = results[1];

        return P
          .map(records, function (record) {
            return new SmartFieldsValuesInjector(record, associationField)
              .perform();
          })
          .then(function (records) {
            return new ResourceSerializer(Implementation, associationModel,
              records, integrator, opts, { count: count }).perform();
          });
      })
      .then(function (records) { response.send(records); })
      .catch(next);
  }

  function exportCSV (request, response, next) {
    var association = getAssociation(request);
    var params = _.extend(request.query, request.params, association);
    var models = Implementation.getModels();
    var associationField = getAssociationField(params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });

    var recordsExporter = new Implementation.RecordsExporter(model, opts,
      params, associationModel);
    return new CSVExporter(params, response, associationModel.name,
      recordsExporter)
      .perform()
      .catch(next);
  }

  function add(request, response, next) {
    var params = _.extend(request.params, getAssociation(request));
    var data = request.body;
    var models = Implementation.getModels();
    var associationField = getAssociationField(params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });

    return new Implementation.HasManyAssociator(model, associationModel, opts,
      params, data)
      .perform()
      .then(function () { response.status(204).send(); })
      .catch(next);
  }

  function remove(request, response, next) {
    var params = _.extend(request.params, getAssociation(request));
    var data = request.body;
    var models = Implementation.getModels();
    var associationField = getAssociationField(params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });

    return new Implementation.HasManyDissociator(model, associationModel, opts,
      params, data)
      .perform()
      .then(function () { response.status(204).send(); })
      .catch(next);
  }

  function update(request, response, next) {
    var params = _.extend(request.params, getAssociation(request));
    var data = request.body;
    var models = Implementation.getModels();
    var associationField = getAssociationField(params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });

    return new Implementation.BelongsToUpdater(model, associationModel, opts,
      params, data)
      .perform()
      .then(function () { response.status(204).send(); })
      .catch(next);
  }

  this.perform = function () {
    // NOTICE: HasMany associations routes
    _.each(SchemaUtil.getHasManyAssociations(schema), function (association) {
      app.get(path.generate(modelName + '/:recordId/relationships/' +
        association.field + '.csv', opts), auth.ensureAuthenticated, exportCSV);
      app.get(path.generate(modelName + '/:recordId/relationships/' +
        association.field, opts), auth.ensureAuthenticated, index);
      app.post(path.generate(modelName + '/:recordId/relationships/' +
        association.field, opts), auth.ensureAuthenticated, add);
      app.delete(path.generate(modelName + '/:recordId/relationships/' +
        association.field, opts), auth.ensureAuthenticated, remove);
    });

    // NOTICE: belongsTo associations routes
    _.each(SchemaUtil.getBelongsToAssociations(schema), function (association) {
      app.put(path.generate(modelName + '/:recordId/relationships/' +
        association.field, opts), auth.ensureAuthenticated, update);
    });
  };
};
