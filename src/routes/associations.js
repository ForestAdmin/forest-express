const _ = require('lodash');
const nodePath = require('path');
const SchemaUtil = require('../utils/schema');
const auth = require('../services/auth');
const path = require('../services/path');
const ResourceSerializer = require('../serializers/resource');
const Schemas = require('../generators/schemas');
const CSVExporter = require('../services/csv-exporter');
const ResourceDeserializer = require('../deserializers/resource');

module.exports = function Associations(app, model, Implementation, integrator, opts) {
  const modelName = Implementation.getModelName(model);
  const schema = Schemas.schemas[modelName];

  function getAssociationField(associationName) {
    const field = _.find(schema.fields, { field: associationName });
    if (field && field.reference) {
      return field.reference.split('.')[0];
    }
    return null;
  }

  function getAssociation(request) {
    const pathSplit = request.route.path.split('/');
    let associationName = pathSplit[pathSplit.length - 1];

    if (nodePath.extname(associationName) === '.csv') {
      associationName = nodePath.basename(associationName, '.csv');
    } else if (associationName === 'count') {
      associationName = pathSplit[pathSplit.length - 2];
    }

    return { associationName };
  }

  function getContext(request) {
    const association = getAssociation(request);
    const params = _.extend(request.query, request.params, association);
    const models = Implementation.getModels();
    const associationField = getAssociationField(params.associationName);
    const associationModel = _.find(models, (refModel) =>
      Implementation.getModelName(refModel) === associationField);

    return { params, associationModel };
  }

  function list(request, response, next) {
    const { params, associationModel } = getContext(request);

    return new Implementation.HasManyGetter(model, associationModel, opts, params)
      .perform()
      .then(([records, fieldsSearched]) => new ResourceSerializer(
        Implementation,
        associationModel,
        records,
        integrator,
        null,
        fieldsSearched,
        params.search,
      ).perform())
      .then((records) => response.send(records))
      .catch(next);
  }

  function count(request, response, next) {
    const { params, associationModel } = getContext(request);

    return new Implementation.HasManyGetter(model, associationModel, opts, params)
      .count()
      .then((recordsCount) => response.send({ count: recordsCount }))
      .catch(next);
  }

  function exportCSV(request, response, next) {
    const { params, associationModel } = getContext(request);

    const recordsExporter = new Implementation.RecordsExporter(
      model,
      opts,
      params,
      associationModel,
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
    const associationModel = _.find(
      models,
      (innerModel) => Implementation.getModelName(innerModel) === associationField,
    );

    return new Implementation.HasManyAssociator(
      model, associationModel, opts,
      params, data,
    )
      .perform()
      .then(() => { response.status(204).send(); })
      .catch(next);
  }

  function remove(request, response, next) {
    const params = _.extend(request.params, getAssociation(request), request.query);
    const data = request.body;
    const models = Implementation.getModels();
    const associationField = getAssociationField(params.associationName);
    const associationModel = _.find(
      models,
      (innerModel) => Implementation.getModelName(innerModel) === associationField,
    );

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
    const associationModel = _.find(
      models,
      (innerModel) => Implementation.getModelName(innerModel) === associationField,
    );

    return new Implementation.BelongsToUpdater(
      model,
      associationModel,
      opts,
      params,
      data,
    )
      .perform()
      .then(() => { response.status(204).send(); })
      .catch(next);
  }

  function updateEmbeddedDocument(association) {
    return (request, response, next) =>
      new ResourceDeserializer(Implementation, model, request.body, false)
        .perform()
        .then((record) => new Implementation
          .EmbeddedDocumentUpdater(model, request.params, association, record)
          .perform())
        .then(() => response.status(204).send())
        .catch(next);
  }

  this.perform = () => {
    // NOTICE: HasMany associations routes
    _.each(SchemaUtil.getHasManyAssociations(schema), (association) => {
      app.get(path.generate(`${modelName}/:recordId/relationships/${
        association.field}.csv`, opts), auth.ensureAuthenticated, exportCSV);
      app.get(path.generate(`${modelName}/:recordId/relationships/${
        association.field}`, opts), auth.ensureAuthenticated, list);
      app.get(
        path.generate(`${modelName}/:recordId/relationships/${association.field}/count`, opts),
        auth.ensureAuthenticated,
        count,
      );
      app.post(path.generate(`${modelName}/:recordId/relationships/${
        association.field}`, opts), auth.ensureAuthenticated, add);
      // NOTICE: This route only works for embedded has many
      app.put(
        path.generate(`${modelName}/:recordId/relationships/${association.field}/:recordIndex`, opts),
        auth.ensureAuthenticated,
        updateEmbeddedDocument(association.field),
      );
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
