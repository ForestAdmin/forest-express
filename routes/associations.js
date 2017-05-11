'use strict';
var _ = require('lodash');
var P = require('bluebird');
var logger = require('../services/logger');
var ResourceSerializer = require('../serializers/resource');
var Schemas = require('../generators/schemas');
var auth = require('../services/auth');
var path = require('../services/path');

module.exports = function (app, model, Implementation, integrator, opts) {
  var modelName = Implementation.getModelName(model);
  var schema = Schemas.schemas[modelName];
  var schemaAssociation;


  function getAssociationField(associationName) {
    var field = _.find(schema.fields, { field: associationName });
    if (field && field.reference) {
      return field.reference.split('.')[0];
    }
  }

  function setSmartFieldValue(record, field, modelName) {
    if (field.value) {
      logger.warn('DEPRECATION WARNING: Smart Fields "value" method is ' +
        'deprecated. Please use "get" method in your collection ' +
        modelName + ' instead.');
    }

    var value = field.get ? field.get(record) : field.value(record);
    if (value && _.isFunction(value.then)) {
      return value.then(function (result) { record[field.field] = result; });
    } else {
      record[field.field] = value;
    }
  }

  function injectSmartFields(record) {
    return P.each(schemaAssociation.fields, function (field) {
      if (!record[field.field]) {
        if (field.get || field.value) {
          return setSmartFieldValue(record, field, modelName);
        } else if (_.isArray(field.type)) {
          record[field.field] = [];
        }
      } else if (field.reference) {
        var modelNameAssociation = field.reference.split('.')[0];
        var schemaAssociation = Schemas.schemas[modelNameAssociation];

        if (schemaAssociation) {
          return P.each(schemaAssociation.fields, function (fieldAssociation) {
            if (!record[field.field][fieldAssociation.field] &&
              (fieldAssociation.get || fieldAssociation.value)) {
              return setSmartFieldValue(record[field.field],
                fieldAssociation, modelNameAssociation);
            }
          });
        }
      }
    }).thenReturn(record);
  }

  function index(request, response, next) {
    var params = _.extend(request.query, request.params);
    var models = Implementation.getModels();
    var associationField = getAssociationField(request.params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });
    schemaAssociation = Schemas.schemas[associationModel.name];

    if (!associationModel) { return response.status(404).send(); }

    return new Implementation.HasManyGetter(model, associationModel, opts,
      params)
      .perform()
      .then(function (results) {
        var count = results[0];
        var records = results[1];

        return P
          .map(records, injectSmartFields)
          .then(function (records) {
            return new ResourceSerializer(Implementation, associationModel,
              records, integrator, opts, { count: count }).perform();
          });
      })
      .then(function (records) { response.send(records); })
      .catch(next);
  }

  function add(request, response, next) {
    var data = request.body;
    var models = Implementation.getModels();
    var associationField = getAssociationField(request.params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });

    return new Implementation.HasManyAssociator(model, associationModel, opts,
      request.params, data)
      .perform()
      .then(function () { response.status(204).send(); })
      .catch(next);
  }

  function remove(request, response, next) {
    var data = request.body;
    var models = Implementation.getModels();
    var associationField = getAssociationField(request.params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });

    return new Implementation.HasManyDissociator(model, associationModel, opts,
      request.params, data)
      .perform()
      .then(function () { response.status(204).send(); })
      .catch(next);
  }

  function update(request, response, next) {
    var data = request.body;
    var models = Implementation.getModels();
    var associationField = getAssociationField(request.params.associationName);
    var associationModel = _.find(models, function (model) {
      return Implementation.getModelName(model) === associationField;
    });

    return new Implementation.BelongsToUpdater(model, associationModel, opts,
      request.params, data)
      .perform()
      .then(function () { response.status(204).send(); })
      .catch(next);
  }

  this.perform = function () {
    app.get(path.generate(modelName + '/:recordId/relationships/:associationName',
      opts), auth.ensureAuthenticated, index);
    app.put(path.generate(modelName + '/:recordId/relationships/:associationName',
      opts), auth.ensureAuthenticated, update);
    app.post(path.generate(modelName + '/:recordId/relationships/:associationName',
      opts), auth.ensureAuthenticated, add);
    app.delete(path.generate(modelName + '/:recordId/relationships/:associationName',
      opts), auth.ensureAuthenticated, remove);
  };
};
