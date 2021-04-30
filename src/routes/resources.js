const auth = require('../services/auth');
const path = require('../services/path');
const ResourceSerializer = require('../serializers/resource');
const ResourceDeserializer = require('../deserializers/resource');
const CSVExporter = require('../services/csv-exporter');
const ParamsFieldsDeserializer = require('../deserializers/params-fields');
const PermissionMiddlewareCreator = require('../middlewares/permissions');
const context = require('../context');
const RecordsGetter = require('../services/exposed/records-getter.js');

module.exports = function Resources(app, model) {
  const { configStore } = context.inject();
  const { Implementation, integrator, lianaOptions } = configStore;
  const modelName = Implementation.getModelName(model);

  this.list = (request, response, next) => {
    const params = request.query;
    const fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();

    return new Implementation.ResourcesGetter(model, lianaOptions, params, request.user)
      .perform()
      .then((results) => {
        const records = results[0];
        const fieldsSearched = results[1];

        return new ResourceSerializer(
          Implementation,
          model,
          records,
          integrator,
          null,
          fieldsSearched,
          params.search,
          fieldsPerModel,
        ).perform();
      })
      .then((records) => {
        response.send(records);
      })
      .catch(next);
  };

  this.count = (request, response, next) => {
    const params = request.query;

    return new Implementation.ResourcesGetter(model, lianaOptions, params, request.user)
      .count()
      .then((count) => response.send({ count }))
      .catch(next);
  };

  this.exportCSV = (request, response, next) => {
    const params = request.query;
    const recordsExporter = new Implementation.ResourcesExporter(
      model,
      lianaOptions,
      params,
      request.user,
    );
    return new CSVExporter(params, response, modelName, recordsExporter)
      .perform()
      .catch(next);
  };

  this.get = (request, response, next) =>
    new Implementation.ResourceGetter(model, request.params, request.user)
      .perform()
      .then((record) => new ResourceSerializer(
        Implementation,
        model,
        record,
        integrator,
      ).perform())
      .then((record) => {
        response.send(record);
      })
      .catch(next);

  this.create = (request, response, next) => {
    new ResourceDeserializer(Implementation, model, request.body, true, {
      omitNullAttributes: true,
    }).perform()
      .then((params) => new Implementation.ResourceCreator(model, params, request.user).perform())
      .then((record) => new ResourceSerializer(
        Implementation,
        model,
        record,
        integrator,
      ).perform())
      .then((record) => {
        response.send(record);
      })
      .catch(next);
  };

  this.update = (request, response, next) => {
    new ResourceDeserializer(Implementation, model, request.body, false)
      .perform()
      .then((record) => {
        new Implementation.ResourceUpdater(model, request.params, record, request.user)
          .perform()
          .then((updatedRecord) => new ResourceSerializer(
            Implementation,
            model,
            updatedRecord,
            integrator,
          ).perform())
          .then((updatedRecord) => {
            response.send(updatedRecord);
            return updatedRecord;
          })
          .catch(next);
      });
  };

  this.remove = (request, response, next) => {
    new Implementation.ResourceRemover(model, request.params, request.user)
      .perform()
      .then(() => {
        response.status(204).send();
      })
      .catch(next);
  };

  this.removeMany = async (request, response, next) => {
    const ids = await new RecordsGetter(model).getIdsFromRequest(request);

    try {
      await new Implementation.ResourcesRemover(model, ids, request.user).perform();
    } catch (e) {
      next(e);
    }
    response.status(204).send();
  };

  const permissionMiddlewareCreator = new PermissionMiddlewareCreator(modelName);

  this.perform = () => {
    app.get(
      `${path.generate(modelName, lianaOptions)}.csv`,
      auth.ensureAuthenticated,
      permissionMiddlewareCreator.export(),
      this.exportCSV,
    );
    app.get(
      path.generate(modelName, lianaOptions),
      auth.ensureAuthenticated,
      permissionMiddlewareCreator.list(),
      this.list,
    );
    app.get(
      path.generate(`${modelName}/count`, lianaOptions),
      auth.ensureAuthenticated,
      permissionMiddlewareCreator.list(),
      this.count,
    );
    app.get(
      path.generate(`${modelName}/:recordId`, lianaOptions),
      auth.ensureAuthenticated,
      permissionMiddlewareCreator.details(),
      this.get,
    );
    app.post(
      path.generate(modelName, lianaOptions),
      auth.ensureAuthenticated,
      permissionMiddlewareCreator.create(),
      this.create,
    );
    app.put(
      path.generate(`${modelName}/:recordId`, lianaOptions),
      auth.ensureAuthenticated,
      permissionMiddlewareCreator.update(),
      this.update,
    );
    app.delete(
      path.generate(`${modelName}/:recordId`, lianaOptions),
      auth.ensureAuthenticated,
      permissionMiddlewareCreator.delete(),
      this.remove,
    );
    app.delete(
      path.generate(modelName, lianaOptions),
      auth.ensureAuthenticated,
      permissionMiddlewareCreator.delete(),
      this.removeMany,
    );
  };
};
