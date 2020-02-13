const AbstractRecordService = require('./abstract-records-service');
const ParamsFieldsDeserializer = require('../../deserializers/params-fields');
const Schemas = require('../../generators/schemas');
const IdsFromRequestRetriever = require('../../services/ids-from-request-retriever');

class RecordsGetter extends AbstractRecordService {
  getAll(params) {
    this.searchValue = params.search;
    this.fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();
    return new this.Implementation.ResourcesGetter(this.model, this.lianaOptions, params)
      .perform()
      .then(([records, fieldsSearched]) => {
        this.fieldsSearched = fieldsSearched;
        return records;
      });
  }

  // NOTICE: This function accept either query or ID list params and return an ID list.
  //         It could be used to handle both "select all" (query) and "select some" (ids).
  //         It also handles related data.
  async getIdsFromRequest(params) {
    const isRelatedData = (attributes) =>
      attributes.parentCollectionId
      && attributes.parentCollectionName
      && attributes.parentAssociationName;

    const recordsGetter = async (attributes) => {
      const { parentCollectionId, parentCollectionName, parentAssociationName } = attributes;
      if (isRelatedData(attributes)) {
        const parentModel = this.Implementation.getModels()[parentCollectionName];
        const [records] = await new this.Implementation.HasManyGetter(
          parentModel,
          this.model,
          this.lianaOptions,
          {
            ...params,
            ...attributes,
            recordId: parentCollectionId,
            associationName: parentAssociationName,
          },
        ).perform();
        return records;
      }
      return this.getAll(attributes);
    };

    const recordsCounter = async (attributes) => {
      const { parentCollectionId, parentCollectionName, parentAssociationName } = attributes;
      if (isRelatedData(attributes)) {
        const parentModel = this.Implementation.getModels()[parentCollectionName];
        return new this.Implementation.HasManyGetter(
          parentModel,
          this.model,
          this.lianaOptions,
          { ...params, recordId: parentCollectionId, associationName: parentAssociationName },
        ).count();
      }
      return new this.Implementation.ResourcesGetter(
        this.model,
        this.lianaOptions,
        attributes.allRecordsSubsetQuery,
      ).count(attributes.allRecordsSubsetQuery);
    };
    const primaryKeysGetter = () => Schemas.schemas[this.Implementation.getModelName(this.model)];

    return new IdsFromRequestRetriever(recordsGetter, recordsCounter, primaryKeysGetter)
      .perform(params);
  }
}

module.exports = RecordsGetter;
