'use strict';
var _ = require('lodash');
var SchemaUtil = require('../utils/schema');
var auth = require('../services/auth');
var path = require('../services/path');
var ResourceSerializer = require('../serializers/resource');
var Schemas = require('../generators/schemas');
var CSVExporter = require('../services/csv-exporter');
var ResourceDeserializer = require('../deserializers/resource');

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
        var decorators = results[1];
        var records = results[2];

        var meta = {
          count: count
        };

        if (decorators) {
          meta.decorators = decorators;
        }

        return new ResourceSerializer(
          Implementation,
          associationModel,
          records,
          integrator,
          opts,
          meta
        ).perform();
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
    return new CSVExporter(params, response,
      Implementation.getModelName(associationModel), recordsExporter)
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
    var params = _.extend(request.params, getAssociation(request), request.query);
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

  function updateEmbeddedDocument(association) {
    return function (request, response, next) {
      return new ResourceDeserializer(Implementation, model, request.body, false)
        .perform()
        .then(function (record) {
          return new Implementation
            .EmbeddedDocumentUpdater(model, request.params, association, record)
            .perform();
        })
        .then(function () {
          response.status(204).send();
        })
        .catch(next);
    };
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
      // NOTICE: This route only works for embedded has many
      app.put(
        path.generate(
          modelName + '/:recordId/relationships/' +  association.field + '/:recordIndex', opts),
        auth.ensureAuthenticated,
        updateEmbeddedDocument(association.field)
      );
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
