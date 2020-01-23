const AbstractRecordService = require('./abstract-records-service');
const ParamsFieldsDeserializer = require('../../deserializers/params-fields');
const RecordsCounter = require('./records-counter');

const BATCH_PAGE_SIZE = 100;

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

  // NOTICE: This function accept either query or body (that contains ID list) params
  //         and return an ID list. It could be used to handle both "select all" (query)
  //         and "select some" (ids).
  async getIdsFromRequest(params) {
    // NOTICE: If it receives a list of ID, return it as is.
    if (params.body
      && params.body.data
      && params.body.data.attributes
      && params.body.data.attributes.ids) {
      return params.body.data.attributes.ids;
    }

    // NOTICE: records IDs are returned with a batch.
    const totalRecords = await new RecordsCounter(this.model).count(params.query);
    return Array.from({ length: totalRecords / BATCH_PAGE_SIZE })
      .reduce(async (accumulator, _, index) => [...await accumulator, ...(await this.getAll(
        { ...params.query, page: { number: `${index + 1}`, size: `${BATCH_PAGE_SIZE}` } },
      )).map((record) => record.id)], []);
  }
}

module.exports = RecordsGetter;
