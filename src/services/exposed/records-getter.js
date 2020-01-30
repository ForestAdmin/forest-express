const AbstractRecordService = require('./abstract-records-service');
const ParamsFieldsDeserializer = require('../../deserializers/params-fields');
const Schemas = require('../../generators/schemas');

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

    // NOTICE: Build id from primary keys (there can be multiple primary keys).
    //         See: https://github.com/ForestAdmin/forest-express-sequelize/blob/42283494de77c9cebe96adbe156caa45c86a80fa/src/services/composite-keys-manager.js#L24-L40
    const { primaryKeys } = Schemas.schemas[this.Implementation.getModelName(this.model)];
    const getId = (record) => primaryKeys.map((primaryKey) => record[primaryKey]).join('-');

    // NOTICE: Get records count
    const recordsCount = await new this.Implementation.ResourcesGetter(
      this.model,
      this.lianaOptions,
      params,
    ).count(params.query);

    // NOTICE: records IDs are returned with a batch.
    const recordsIds = await Array.from({ length: Math.ceil(recordsCount / BATCH_PAGE_SIZE) })
      .reduce(async (accumulator, _, index) => {
        const currentRecordsParams = {
          ...params.query,
          page: { number: `${index + 1}`, size: `${BATCH_PAGE_SIZE}` },
        };
        const currentRecords = await this.getAll(currentRecordsParams);

        return [...await accumulator, ...currentRecords.map((record) => getId(record))];
      }, []);

    // NOTICE: remove excluded IDs.
    if (params.query.excludedIds) {
      const excludedIds = params.query.excludedIds.split(',');
      return recordsIds.filter((id) => !excludedIds.includes(id));
    }

    return recordsIds;
  }
}

module.exports = RecordsGetter;
