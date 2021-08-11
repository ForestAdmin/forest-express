const AbstractRecordService = require('./abstract-records-service');
const ParamsFieldsDeserializer = require('../../deserializers/params-fields');
const Schemas = require('../../generators/schemas');
const IdsFromRequestRetriever = require('../../services/ids-from-request-retriever');

class RecordsGetter extends AbstractRecordService {
  async getAll(extraParams = {}) {
    // extraParams is used by getIdsFromRequest for record selection on bulk smart actions.
    const params = { ...this.params, ...extraParams };

    // Load records
    const { ResourcesGetter } = this.Implementation;
    const getter = new ResourcesGetter(this.model, this.lianaOptions, params, this.user);
    const [records, fieldsSearched] = await getter.perform();

    // Save search value and searched fields for 'meta' generation on serialization
    // (used for search highlighting on the frontend).
    this.searchValue = params.search;
    this.fieldsSearched = fieldsSearched;

    // Save list of requested fields for smartfield serialization
    this.fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();
    return records;
  }

  // NOTICE: This function accept either query or ID list params and return an ID list.
  //         It could be used to handle both "select all" (query) and "select some" (ids).
  //         It also handles related data.
  async getIdsFromRequest(params) {
    const isRelatedData = (attributes) =>
      attributes.parentCollectionId
      && attributes.parentCollectionName
      && attributes.parentAssociationName;

    const primaryKeysGetter = () => Schemas.schemas[this.Implementation.getModelName(this.model)];

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

      return this.getAll({
        ...attributes.allRecordsSubsetQuery,
        page: attributes.page,
        fields: { [this.model.name]: primaryKeysGetter().primaryKeys.join(',') || '_id' },
      });
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

    return new IdsFromRequestRetriever(recordsGetter, recordsCounter, primaryKeysGetter)
      .perform(params);
  }
}

module.exports = RecordsGetter;
