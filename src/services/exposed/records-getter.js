const AbstractRecordService = require('./abstract-records-service');
const ParamsFieldsDeserializer = require('../../deserializers/params-fields');
const QueryDeserializer = require('../../deserializers/query');
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

  // NOTICE: This function accept either query or ID list params and return an ID list.
  //          It could be used to handle both "select all" (query) and "select some" (ids).
  async getIdsFromRequest(params) {
    const hasBodyAttributes = params.body && params.body.data && params.body.data.attributes;

    const attributes = hasBodyAttributes
      && new QueryDeserializer(params.body.data.attributes).perform();

    const isSelectAllRecordsQuery = hasBodyAttributes
      && attributes.areAllRecordsSelected === true;

    // NOTICE: If it is not a "select all records" query and it receives a list of ID.
    if (!isSelectAllRecordsQuery && attributes.ids) {
      return attributes.ids;
    }

    // NOTICE: Build id from primary keys (there can be multiple primary keys).
    //         See: https://github.com/ForestAdmin/forest-express-sequelize/blob/42283494de77c9cebe96adbe156caa45c86a80fa/src/services/composite-keys-manager.js#L24-L40
    const { primaryKeys } = Schemas.schemas[this.Implementation.getModelName(this.model)];
    const getId = (record) => primaryKeys.map((primaryKey) => record[primaryKey]).join('-');

    // NOTICE: Get records count
    const recordsCount = await new this.Implementation.ResourcesGetter(
      this.model,
      this.lianaOptions,
      attributes.query,
    ).count(attributes.query);

    // NOTICE: records IDs are returned with a batch.
    const recordsIds = await Array.from({ length: Math.ceil(recordsCount / BATCH_PAGE_SIZE) })
      .reduce(async (accumulator, _, index) => {
        const currentRecordsParams = {
          ...attributes.query,
          page: { number: `${index + 1}`, size: `${BATCH_PAGE_SIZE}` },
        };
        const currentRecords = await this.getAll(currentRecordsParams);

        return [...await accumulator, ...currentRecords.map((record) => getId(record))];
      }, []);

    // NOTICE: remove excluded IDs.
    if (attributes.excludedIds) {
      return recordsIds.filter((id) => !attributes.excludedIds.includes(id));
    }

    return recordsIds;
  }
}

module.exports = RecordsGetter;
