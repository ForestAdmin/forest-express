const _ = require('lodash');
const nodePath = require('path');
const SchemaUtil = require('../utils/schema');
const auth = require('../services/auth');
const path = require('../services/path');
const ResourceSerializer = require('../serializers/resource');
const Schemas = require('../generators/schemas');
const CSVExporter = require('../services/csv-exporter');
const ResourceDeserializer = require('../deserializers/resource');
const ParamsFieldsDeserializer = require('../deserializers/params-fields');
const context = require('../context');
const RecordsGetter = require('../services/exposed/records-getter');

module.exports = function Associations(app, model, Implementation, integrator, opts) {
  const { modelsManager } = context.inject();
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
    const models = modelsManager.getModels();
    const associationField = getAssociationField(params.associationName);
    const associationModel = _.find(models, (refModel) =>
      Implementation.getModelName(refModel) === associationField);

    return { params, associationModel };
  }

  function list(request, response, next) {
    const { params, associationModel } = getContext(request);
    const fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();

    return new Implementation.HasManyGetter(model, associationModel, opts, params, request.user)
      .perform()
      .then(([records, fieldsSearched]) => new ResourceSerializer(
        Implementation,
        associationModel,
        records,
        integrator,
        null,
        fieldsSearched,
        params.search,
        fieldsPerModel,
      ).perform())
      .then((records) => response.send(records))
      .catch(next);
  }

  function count(request, response, next) {
    const { params, associationModel } = getContext(request);

    return new Implementation.HasManyGetter(model, associationModel, opts, params, request.user)
      .count()
      .then((recordsCount) => response.send({ count: recordsCount }))
      .catch(next);
  }

  function exportCSV(request, response, next) {
    const { params, associationModel } = getContext(request);

    const recordsExporter = new Implementation.ResourcesExporter(
      model,
      opts,
      params,
      associationModel,
      request.user,
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
    const models = modelsManager.getModels();
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

  async function remove(request, response, next) {
    const { params, associationModel } = getContext(request);

    let body;
    // NOTICE: There are three ways to receive request data from frontend:
    //         - Legacy: `{ body: { data: [ { id: 1, … }, { id: 2, … }, … ]} }`.
    //         - IDs (select some)
    //         - Or query params (select all).
    //
    //         The HasManyDissociator currently accepts a `data` parameter that has to be formatted
    //         as the legacy one.
    const hasBodyAttributes = request.body && request.body.data && request.body.data.attributes;
    const isLegacyRequest = request.body && request.body.data && Array.isArray(request.body.data);
    if (!hasBodyAttributes && isLegacyRequest) {
      body = request.body;
    } else if (hasBodyAttributes) {
      const getter = new RecordsGetter(model, request.user, request.query);
      const ids = await getter.getIdsFromRequest(request);

      body = { data: ids.map((id) => ({ id })) };
    }

    return new Implementation.HasManyDissociator(
      model,
      associationModel,
      opts,
      params,
      body,
    )
      .perform()
      .then(() => { response.status(204).send(); })
      .catch(next);
  }

  function update(request, response, next) {
    const params = _.extend(request.params, getAssociation(request));
    const data = request.body;
    const models = modelsManager.getModels();
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
