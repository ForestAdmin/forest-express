
const _ = require('lodash');
const SchemaUtil = require('../utils/schema');
const auth = require('../services/auth');
const path = require('../services/path');
const ResourceSerializer = require('../serializers/resource');
const Schemas = require('../generators/schemas');
const CSVExporter = require('../services/csv-exporter');

module.exports = function (app, model, Implementation, integrator, opts) {
  const modelName = Implementation.getModelName(model);
  const schema = Schemas.schemas[modelName];

  function getAssociationField(associationName) {
    const field = _.find(schema.fields, { field: associationName });
    if (field && field.reference) {
      return field.reference.split('.')[0];
    }
  }

  function getAssociation(request) {
    return {
      associationName:
         _.first(_.last(request.route.path.split('/')).split('.csv')),
    };
  }

  function index(request, response, next) {
    const association = getAssociation(request);
    const params = _.extend(request.query, request.params, association);
    const models = Implementation.getModels();
    const associationField = getAssociationField(params.associationName);
    const associationModel = _.find(models, model => Implementation.getModelName(model) === associationField);

    return new Implementation.HasManyGetter(
      model, associationModel, opts,
      params,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const records = results[1];

        return new ResourceSerializer(
          Implementation, associationModel,
          records, integrator, opts, { count },
        ).perform();
      })
      .then((records) => { response.send(records); })
      .catch(next);
  }

  function exportCSV(request, response, next) {
    const association = getAssociation(request);
    const params = _.extend(request.query, request.params, association);
    const models = Implementation.getModels();
    const associationField = getAssociationField(params.associationName);
    const associationModel = _.find(models, model => Implementation.getModelName(model) === associationField);

    const recordsExporter = new Implementation.RecordsExporter(
      model, opts,
      params, associationModel,
    );
    return new CSVExporter(
      params, response,
      Implementation.getModelName(associationModel), recordsExporter,
    )
      .perform()
      .catch(next);
  }

  function add(request, response, next) {
    const params = _.extend(request.params, getAssociation(request));
    const data = request.body;
    const models = Implementation.getModels();
    const associationField = getAssociationField(params.associationName);
    const associationModel = _.find(models, model => Implementation.getModelName(model) === associationField);

    return new Implementation.HasManyAssociator(
      model, associationModel, opts,
      params, data,
    )
      .perform()
      .then(() => { response.status(204).send(); })
      .catch(next);
  }

  function remove(request, response, next) {
    const params = _.extend(request.params, getAssociation(request));
    const data = request.body;
    const models = Implementation.getModels();
    const associationField = getAssociationField(params.associationName);
    const associationModel = _.find(models, model => Implementation.getModelName(model) === associationField);

    return new Implementation.HasManyDissociator(
      model, associationModel, opts,
      params, data,
    )
      .perform()
      .then(() => { response.status(204).send(); })
      .catch(next);
  }

  function update(request, response, next) {
    const params = _.extend(request.params, getAssociation(request));
    const data = request.body;
    const models = Implementation.getModels();
    const associationField = getAssociationField(params.associationName);
    const associationModel = _.find(models, model => Implementation.getModelName(model) === associationField);

    return new Implementation.BelongsToUpdater(
      model, associationModel, opts,
      params, data,
    )
      .perform()
      .then(() => { response.status(204).send(); })
      .catch(next);
  }

  this.perform = function () {
    // NOTICE: HasMany associations routes
    _.each(SchemaUtil.getHasManyAssociations(schema), (association) => {
      app.get(path.generate(`${modelName}/:recordId/relationships/${
        association.field}.csv`, opts), auth.ensureAuthenticated, exportCSV);
      app.get(path.generate(`${modelName}/:recordId/relationships/${
        association.field}`, opts), auth.ensureAuthenticated, index);
      app.post(path.generate(`${modelName}/:recordId/relationships/${
        association.field}`, opts), auth.ensureAuthenticated, add);
      app.delete(path.generate(`${modelName}/:recordId/relationships/${
        association.field}`, opts), auth.ensureAuthenticated, remove);
    });

    // NOTICE: belongsTo associations routes
    _.each(SchemaUtil.getBelongsToAssociations(schema), (association) => {
      app.put(path.generate(`${modelName}/:recordId/relationships/${
        association.field}`, opts), auth.ensureAuthenticated, update);
    });
  };
};
