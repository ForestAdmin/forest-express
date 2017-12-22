
const auth = require('../services/auth');
const path = require('../services/path');
const ResourceSerializer = require('../serializers/resource');
const ResourceDeserializer = require('../deserializers/resource');
const CSVExporter = require('../services/csv-exporter');

module.exports = function (app, model, Implementation, integrator, opts) {
  const modelName = Implementation.getModelName(model);

  this.list = function (request, response, next) {
    return new Implementation.ResourcesGetter(model, opts, request.query)
      .perform()
      .then((results) => {
        const count = results[0];
        const records = results[1];

        return new ResourceSerializer(
          Implementation, model, records,
          integrator, opts, { count },
        ).perform();
      })
      .then((records) => {
        response.send(records);
      })
      .catch(next);
  };

  this.exportCSV = function (request, response, next) {
    const params = request.query;
    const recordsExporter = new Implementation.RecordsExporter(
      model, opts,
      params,
    );
    return new CSVExporter(params, response, modelName, recordsExporter)
      .perform()
      .catch(next);
  };

  this.get = function (request, response, next) {
    return new Implementation.ResourceGetter(model, request.params)
      .perform()
      .then(record => new ResourceSerializer(
        Implementation, model, record,
        integrator, opts,
      ).perform())
      .then((record) => {
        response.send(record);
      })
      .catch(next);
  };

  this.create = function (request, response, next) {
    new ResourceDeserializer(Implementation, model, request.body, true, {
      omitNullAttributes: true,
    }).perform()
      .then(params => new Implementation.ResourceCreator(model, params).perform())
      .then(record => new ResourceSerializer(
        Implementation, model, record,
        integrator, opts,
      ).perform())
      .then((record) => {
        response.send(record);
      })
      .catch(next);
  };

  this.update = function (request, response, next) {
    new ResourceDeserializer(Implementation, model, request.body, false)
      .perform()
      .then((record) => {
        new Implementation.ResourceUpdater(model, request.params, record)
          .perform()
          .then(record => new ResourceSerializer(
            Implementation, model, record,
            integrator, opts,
          ).perform())
          .then((record) => {
            response.send(record);
            return record;
          })
          .catch(next);
      });
  };

  this.remove = function (request, response, next) {
    new Implementation.ResourceRemover(model, request.params)
      .perform()
      .then(() => {
        response.status(204).send();
      })
      .catch(next);
  };

  this.perform = function () {
    app.get(
      `${path.generate(modelName, opts)}.csv`, auth.ensureAuthenticated,
      this.exportCSV,
    );
    app.get(
      path.generate(modelName, opts), auth.ensureAuthenticated,
      this.list,
    );
    app.get(
      path.generate(`${modelName}/:recordId`, opts),
      auth.ensureAuthenticated, this.get,
    );
    app.post(
      path.generate(modelName, opts), auth.ensureAuthenticated,
      this.create,
    );
    app.put(
      path.generate(`${modelName}/:recordId`, opts),
      auth.ensureAuthenticated, this.update,
    );
    app.delete(
      path.generate(`${modelName}/:recordId`, opts),
      auth.ensureAuthenticated, this.remove,
    );
  };
};
