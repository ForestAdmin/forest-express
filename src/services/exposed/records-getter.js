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
  //          It could be used to handle both "select all" (query) and "select some" (ids).
  async getIdsFromRequest(params) {
    if (params
      && params.body
      && params.body.data
      && params.body.data.attributes
      && params.body.data.attributes.all_records_subset_query
      && params.body.data.attributes.all_records_subset_query.parent_collection_id) {
      const parentModel = this.Implementation.getModels()[
        params.body.data.attributes.all_records_subset_query.parent_collection_name
      ];
      const modelName = this.Implementation.getModelName(this.model);
      const associationName = params.body.data.attributes.all_records_subset_query.association_name;
      // const model = Schemas.schemas[modelName];
      const recordsGetter = async (attributes) => {
        const [records] = await new this.Implementation.HasManyGetter(
          parentModel,
          this.model,
          this.lianaOptions,
          {
            ...params,
            ...attributes,
            recordId: params.body.data.attributes.all_records_subset_query.parent_collection_id,
            associationName,
          },
        ).perform();
        return records;
      };
      const recordsCounter = async () =>
        new this.Implementation.HasManyGetter(
          parentModel,
          this.model,
          this.lianaOptions,
          {
            ...params,
            recordId: params.body.data.attributes.all_records_subset_query.parent_collection_id,
            associationName,
          },
        ).count();
      // console.log(Schemas.schemas[modelName]);
      const { primaryKeys } = Schemas.schemas[modelName];

      return new IdsFromRequestRetriever(
        recordsGetter,
        recordsCounter,
        primaryKeys,
      ).perform(params);
    }
    const recordsGetter = async (attributes) => this.getAll(attributes);
    const recordsCounter = async (attributes) => new this.Implementation.ResourcesGetter(
      this.model,
      this.lianaOptions,
      attributes.allRecordsSubsetQuery,
    ).count(attributes.allRecordsSubsetQuery);
    const { primaryKeys } = Schemas.schemas[this.Implementation.getModelName(this.model)];

    return new IdsFromRequestRetriever(recordsGetter, recordsCounter, primaryKeys)
      .perform(params);
  }
}

module.exports = RecordsGetter;
