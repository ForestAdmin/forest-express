'use strict';
var P = require('bluebird');
var auth = require('../services/auth');
var path = require('../services/path');
var ResourceSerializer = require('../serializers/resource');
var ResourceDeserializer = require('../deserializers/resource');
var SmartFieldsValuesInjector = require('../services/smart-fields-values-injector');

module.exports = function (app, model, Implementation, integrator, opts) {
  var modelName = Implementation.getModelName(model);

  this.list = function (request, response, next) {
    return new Implementation.ResourcesGetter(model, opts, request.query)
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
        response.send(records);
      })
      .catch(next);
  };

  this.exportCSV = function (request, response, next) {
    var params = request.query;

    var filename = params.filename + '.csv';
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-disposition', 'attachment; filename=' +
      filename);
    // response.setHeader('Last-Modified'] = Time.now.ctime.to_s

    // NOTICE: From nginx doc: Setting this to "no" will allow unbuffered
    //         responses suitable for Comet and HTTP streaming applications.
    response.setHeader('X-Accel-Buffering', 'no');
    response.setHeader('Cache-Control', 'no-cache');

    var CSVHeader = params.header + '\n';
    var CSVAttributes = params.fields[modelName].split(',');
    response.write(CSVHeader);

    return new Implementation.RecordsExporter(model, opts, params)
      .perform(function (records) {
        return new P(function (resolve) {
          var csvLines = '';
          records.forEach(function (record) {
            var csvLine = '';
            CSVAttributes.forEach(function (attribute) {
              var value;
              if (params.fields[attribute]) {
                if (record[attribute]) {
                  value = record[attribute][params.fields[attribute]];
                }
              } else {
                value = record[attribute];
              }

              csvLine += (value || '') + ',';
            });
            csvLines += csvLine.slice(0, -1) + '\n';
          });
          response.write(csvLines);
          resolve();
        });
        // return P
        //   .map(records, function (record) {
        //     // console.log('========', modelName, record);
        //     return new SmartFieldsValuesInjector(record, modelName).perform();
        //   })
        //   .then(function (records) {
        //     console.log('new line!!!!');
        //     response.write('new line!!!!');
        //   });
      })
      .then(function () {
        // response.end('');
        response.end();
      })
      .catch(next);
  };

  this.get = function (request, response, next) {
    return new Implementation.ResourceGetter(model, request.params)
      .perform()
      .then(function(records) {
        return new SmartFieldsValuesInjector(records, modelName).perform();
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
    app.get(path.generate(modelName, opts) + '.csv', // auth.ensureAuthenticated,
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
