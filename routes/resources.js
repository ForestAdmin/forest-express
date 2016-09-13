'use strict';
var P = require('bluebird');
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
        return P
          .map(records, function (record) {
            return P.each(schema.fields, function (field) {
              if (!record[field.field]) {
                if (field.value) {
                  var value = field.value(record);
                  if (_.isFunction(value.then)) {
                    return value.then(function (value) {
                      record[field.field] = value;
                    });
                  } else {
                    record[field.field] = value;
                  }
                } else if (_.isArray(field.type)) {
                  record[field.field] = [];
                }
              }
            }).thenReturn(record);
          })
          .then(function (records) {
            return new ResourceSerializer(Implementation, model, records,
              opts, { count: count }).perform();
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
    app.get((opts.expressMountParent ? '/' : '/forest/') + modelName, auth.ensureAuthenticated, this.list);

    app.get((opts.expressMountParent ? '/' : '/forest/') + modelName + '/:recordId', auth.ensureAuthenticated,
      this.get);

    app.post((opts.expressMountParent ? '/' : '/forest/') + modelName, auth.ensureAuthenticated,
      this.create);

    app.put((opts.expressMountParent ? '/' : '/forest/') + modelName + '/:recordId', auth.ensureAuthenticated,
      this.update);

    app.delete((opts.expressMountParent ? '/' : '/forest/') + modelName + '/:recordId', auth.ensureAuthenticated,
      this.remove);
  };
};

