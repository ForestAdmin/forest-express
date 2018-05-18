'use strict';
var auth = require('../services/auth');
var path = require('../services/path');
var ResourceSerializer = require('../serializers/resource');
var ResourceDeserializer = require('../deserializers/resource');
var CSVExporter = require('../services/csv-exporter');
var ParamsFieldsDeserializer = require('../deserializers/params-fields');

module.exports = function (app, model, Implementation, integrator, opts) {
  var modelName = Implementation.getModelName(model);

  this.list = function (request, response, next) {
    var params = request.query;
    var fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();

    return new Implementation.ResourcesGetter(model, opts, params)
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
          model,
          records,
          integrator,
          opts,
          meta,
          fieldsPerModel
        ).perform();
      })
      .then(function (records) {
        response.send(records);
      })
      .catch(next);
  };

  this.exportCSV = function (request, response, next) {
    var params = request.query;
    var recordsExporter = new Implementation.RecordsExporter(model, opts,
      params);
    return new CSVExporter(params, response, modelName, recordsExporter)
      .perform()
      .catch(next);
  };

  this.get = function (request, response, next) {
    return new Implementation.ResourceGetter(model, request.params)
      .perform()
      .then(function (record) {
        return new ResourceSerializer(Implementation, model, record,
          integrator, opts).perform();
      })
      .then(function (record) {
        response.send(record);
      })
      .catch(next);
  };

  this.create = function (request, response, next) {
    new ResourceDeserializer(Implementation, model, request.body, true, {
      omitNullAttributes: true
    }).perform()
      .then(function (params) {
        return new Implementation.ResourceCreator(model, params).perform();
      })
      .then(function (record) {
        return new ResourceSerializer(Implementation, model, record,
          integrator, opts).perform();
      })
      .then(function (record) {
        response.send(record);
      })
      .catch(next);
  };

  this.update = function (request, response, next) {
    new ResourceDeserializer(Implementation, model, request.body, false)
      .perform()
      .then(function (record) {
        new Implementation.ResourceUpdater(model, request.params, record)
          .perform()
          .then(function (record) {
            return new ResourceSerializer(Implementation, model, record,
              integrator, opts).perform();
          })
          .then(function (record) {
            response.send(record);
            return record;
          })
          .catch(next);
      });
  };

  this.remove = function (request, response, next) {
    new Implementation.ResourceRemover(model, request.params)
      .perform()
      .then(function () {
        response.status(204).send();
      })
      .catch(next);
  };

  this.perform = function () {
    app.get(path.generate(modelName, opts) + '.csv', auth.ensureAuthenticated,
      this.exportCSV);
    app.get(path.generate(modelName, opts), auth.ensureAuthenticated,
      this.list);
    app.get(path.generate(modelName + '/:recordId', opts),
      auth.ensureAuthenticated, this.get);
    app.post(path.generate(modelName, opts), auth.ensureAuthenticated,
      this.create);
    app.put(path.generate(modelName + '/:recordId', opts),
      auth.ensureAuthenticated, this.update);
    app.delete(path.generate(modelName + '/:recordId', opts),
      auth.ensureAuthenticated, this.remove);
  };
};
