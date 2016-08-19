'use strict';
var _ = require('lodash');
var ResourceSerializer = require('../serializers/resource');
var ResourceDeserializer = require('../deserializers/resource');
var auth = require('../services/auth');
var Schemas = require('../generators/schemas');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);
  var schema = Schemas.schemas[Implementation.getModelName(model)];

  this.list = function (req, res, next) {
    return new Implementation.ResourcesGetter(model, opts, req.query)
      .perform()
      .then(function (results) {
        var count = results[0];
        var records = results[1];

        // Inject smart fields.
        records.map(function (record) {
          schema.fields.forEach(function (field) {
            if (!record[field.field]) {
              if (field.value) {
                record[field.field] = field.value(record);
              } else if (_.isArray(field.type)) {
                record[field.field] = [];
              }
            }
          });
        });

        return new ResourceSerializer(Implementation, model, records, opts, {
          count: count
        }).perform();
      })
      .then(function (records) {
        res.send(records);
      })
      .catch(next);
  };

  this.get = function (req, res, next) {
    return new Implementation.ResourceGetter(model, req.params)
      .perform()
      .then(function (record) {
        return new ResourceSerializer(Implementation, model, record, opts)
          .perform();
      })
      .then(function (record) {
        res.send(record);
      })
      .catch(next);
  };

  this.create = function (req, res, next) {
    new ResourceDeserializer(Implementation, model, req.body, {
      omitNullAttributes: true
    }).perform()
      .then(function (params) {
        return new Implementation.ResourceCreator(model, params).perform();
      })
      .then(function (record) {
        return new ResourceSerializer(Implementation, model, record, opts)
          .perform();
      })
      .then(function (record) {
        res.send(record);
      })
      .catch(next);
  };

  this.update = function (req, res, next) {
    new ResourceDeserializer(Implementation, model, req.body)
      .perform()
      .then(function (params) {
        new Implementation.ResourceUpdater(model, params)
          .perform()
          .then(function (record) {
            return new ResourceSerializer(Implementation, model, record, opts)
              .perform();
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
    app.get('/forest/' + modelName, auth.ensureAuthenticated, this.list);

    app.get('/forest/' + modelName + '/:recordId', auth.ensureAuthenticated,
      this.get);

    app.post('/forest/' + modelName, auth.ensureAuthenticated,
      this.create);

    app.put('/forest/' + modelName + '/:recordId', auth.ensureAuthenticated,
      this.update);

    app.delete('/forest/' + modelName + '/:recordId', auth.ensureAuthenticated,
      this.remove);
  };
};

