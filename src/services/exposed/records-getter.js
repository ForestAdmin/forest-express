const context = require('../../context');
const ParamsFieldsDeserializer = require('../../deserializers/params-fields');
const Schemas = require('../../generators/schemas');
const ResourceSerializer = require('../../serializers/resource');
const IdsFromRequestRetriever = require('../../services/ids-from-request-retriever');
const RecordSerializer = require('./record-serializer');

class RecordsGetter extends RecordSerializer {
  constructor(model, user, params, { configStore, modelsManager } = context.inject()) {
    super(model, user, params, { configStore });
    this.modelsManager = modelsManager;

    if (!params?.timezone) {
      throw new Error(
        `Since v8.0.0 the RecordsGetter's constructor has changed and requires access to the requesting user and query string.\n
        Please check the migration guide at https://docs.forestadmin.com/documentation/how-tos/maintain/upgrade-notes-sql-mongodb/upgrade-to-v8`,
      );
    }
  }

  /**
   * Retrieve records matching request provided in constructor.
   */
  async getAll(extraParams = {}) {
    // extraParams is used by getIdsFromRequest for record selection on bulk smart actions.
    const params = { ...this.params, ...extraParams };

    // Load records
    const [records, fieldsSearched] = await new this.Implementation
      .ResourcesGetter(this.model, this.lianaOptions, params, this.user)
      .perform();

    // Save search value and searched fields for 'meta' generation on serialization
    // (used for search highlighting on the frontend).
    this.searchValue = params.search;
    this.fieldsSearched = fieldsSearched;

    // Save list of requested fields for smartfield serialization
    this.fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();
    return records;
  }

  /**
   * Serialize records.
   *
   * Note that, if called _immediately_ after `getAll()`, this methods
   * - adds meta information for search term highlighting
   * - does not load smartfields that were not explicitly requested by the frontend
   */
  serialize(records, meta = null) {
    return new ResourceSerializer(
      this.Implementation,
      this.model,
      records,
      this.configStore.integrator,
      meta,
      this.fieldsSearched, // for search highlighting
      this.searchValue, // for search highlighting
      this.fieldsPerModel, // smartfield serialization
    ).perform();
  }

  /**
   * Extract list of ids from an express request for bulk smart actions.
   *
   * @todo This method and the associated service need refactoring for code clarity
   *
   * @todo Improve performance: on first sight it seems that applying a bulk smart action checking
   *       "all records" will load the whole table from db just to extract the list of ids.
   *
   * @todo Rename `params` to `request`.
   *       This method is taking `params` but documentation says it takes the express request.
   *
   * @todo Investigate: why is `params` being exploded in the HasManyGetter parameters, but not
   *       provided neither when calling `getAll` or the common ResourcesGetter?
   */
  async getIdsFromRequest(params) {
    // This function accept either query or ID list params and return an ID list.
    // It could be used to handle both "select all" (query) and "select some" (ids).
    // It also handles related data.

    const isRelatedData = (attributes) =>
      attributes.parentCollectionId
      && attributes.parentCollectionName
      && attributes.parentAssociationName;

    const recordsGetter = async (attributes) => {
      const { parentCollectionId, parentCollectionName, parentAssociationName } = attributes;
      if (isRelatedData(attributes)) {
        const parentModel = this.modelsManager.getModels()[parentCollectionName];
        const [records] = await new this.Implementation.HasManyGetter(
          parentModel,
          this.model,
          this.lianaOptions,
          {
            ...this.params,
            ...params,
            ...attributes.allRecordsSubsetQuery,
            page: attributes.page,
            recordId: parentCollectionId,
            associationName: parentAssociationName,
          },
          this.user,
        ).perform();
        return records;
      }
      return this.getAll({ ...attributes.allRecordsSubsetQuery, page: attributes.page });
    };

    const recordsCounter = async (attributes) => {
      const { parentCollectionId, parentCollectionName, parentAssociationName } = attributes;
      if (isRelatedData(attributes)) {
        const parentModel = this.modelsManager.getModels()[parentCollectionName];
        return new this.Implementation.HasManyGetter(
          parentModel,
          this.model,
          this.lianaOptions,
          {
            ...this.params,
            ...params,
            recordId: parentCollectionId,
            associationName: parentAssociationName,
          },
          this.user,
        ).count();
      }

      return new this.Implementation.ResourcesGetter(
        this.model,
        this.lianaOptions,
        { ...this.params, allRecordsSubsetQuery: attributes.allRecordsSubsetQuery },
        this.user,
      ).count(attributes.allRecordsSubsetQuery);
    };
    const primaryKeysGetter = () => Schemas.schemas[this.Implementation.getModelName(this.model)];

    return new IdsFromRequestRetriever(recordsGetter, recordsCounter, primaryKeysGetter)
      .perform(params);
  }
}

module.exports = RecordsGetter;
