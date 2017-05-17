'use strict';
var P = require('bluebird');
var auth = require('../services/auth');
var path = require('../services/path');
var ResourceSerializer = require('../serializers/resource');
var ResourceDeserializer = require('../deserializers/resource');
var SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');

module.exports = function (app, model, Implementation, integrator, opts) {
  var modelName = Implementation.getModelName(model);

  this.list = function (req, res, next) {
    return new Implementation.ResourcesGetter(model, opts, req.query)
      .perform()
      .then(function (results) {
        var count = results[0];
        var records = results[1];

        return P
          .map(records, function (record) {
            return new SmartFieldsValuesInjector(record, modelName).perform();
          })
          .then(function (records) {
            return new ResourceSerializer(Implementation, model, records,
              integrator, opts, { count: count }).perform();
          });
      })
      .then(function (records) {
        res.send(records);
      })
      .catch(next);
  };

  this.get = function (req, res, next) {
    return new Implementation.ResourceGetter(model, req.params)
      .perform()
      .then(function(records) {
        return new SmartFieldsValuesInjector(records, modelName).perform();
      })
      .then(function (record) {
        return new ResourceSerializer(Implementation, model, record,
          integrator, opts).perform();
      })
      .then(function (record) {
        res.send(record);
      })
      .catch(next);
  };

  this.create = function (req, res, next) {
    new ResourceDeserializer(Implementation, model, req.body, true, {
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
        res.send(record);
      })
      .catch(next);
  };

  this.update = function (req, res, next) {
    new ResourceDeserializer(Implementation, model, req.body, false)
      .perform()
      .then(function (params) {
        new Implementation.ResourceUpdater(model, params)
          .perform()
          .then(function (record) {
            return new ResourceSerializer(Implementation, model, record,
              integrator, opts).perform();
          })
          .then(function (record) {
            res.send(record);
            return record;
          })
          .catch(next);
      });
  };

  this.remove = function (req, res, next) {
    new Implementation.ResourceRemover(model, req.params)
      .perform()
      .then(function () {
        res.status(204).send();
      })
      .catch(next);
  };

  this.perform = function () {
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
