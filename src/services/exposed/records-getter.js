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
    const recordsGetter = async (attributes) => this.getAll(attributes);
    const recordsCounter = async (attributes) => new this.Implementation.ResourcesGetter(
      this.model,
      this.lianaOptions,
      attributes.allRecordsSubsetQuery,
    ).count(attributes.allRecordsSubsetQuery);
    const primaryKeysGetter = () => Schemas.schemas[this.Implementation.getModelName(this.model)];

    return new IdsFromRequestRetriever(recordsGetter, recordsCounter, primaryKeysGetter)
      .perform(params);
  }
}

module.exports = RecordsGetter;
