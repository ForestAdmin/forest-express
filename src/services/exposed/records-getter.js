const AbstractRecordService = require('./abstract-records-service');
const ParamsFieldsDeserializer = require('../../deserializers/params-fields');
const Schemas = require('../../generators/schemas');
const QueryDeserializer = require('../../deserializers/query');

class RecordsGetter extends AbstractRecordService {
  /**
   * @param extraParams Deprecated. Should be removed for forest-express@10
   */
  async getAll(extraParams = {}) {
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

  /**
   * Takes a request from a frontend bulk action (bulk smart-action, bulk delete, ...) and
   * returns the list of ids that should be affected.
   *
   * @fixme Cursors should be used instead of offset/limit.
   *        This will be plainfully slow on big collections.
   *
   * @fixme why are we testing for attrs?.allRecords !== true && attrs.ids to detect "all records"
   *        queries? IMHO this should be only attrs?.allRecords
   *
   * @fixme Composite ids are returned separated by a dash "-".
   *        Not sure why, we are using pipes "|" in forest-express-sequelize but changing it
   *        would be a breking change.
   */
  async getIdsFromRequest(request) {
    const { getModelName } = this.Implementation;
    const { primaryKeys } = Schemas.schemas[getModelName(this.model)];
    const attrs = new QueryDeserializer(request?.body?.data?.attributes ?? {}).perform();
    const idsExcludedAsString = attrs?.allRecordsIdsExcluded?.map(String);

    // "select all records" is not selected => we are done.
    if (attrs?.allRecords !== true && attrs.ids) {
      return attrs.ids;
    }

    // Otherwise, query database in a loop to retrieve all ids.
    const ids = [];
    for (let pageNo = 1, done = false; !done; pageNo += 1) {
      const loader = this._getLoader(attrs);

      // ... and keep only packed ids.
      const [records] = await loader.perform(); // eslint-disable-line no-await-in-loop
      let recordIds = records.map((record) => primaryKeys.map((primaryKey) => record[primaryKey]).join('-'));
      if (attrs.allRecordsIdsExcluded) {
        // Ensure that IDs are comparables (avoid ObjectId or Integer issues).
        recordIds = recordIds.filter((id) => !idsExcludedAsString.includes(String(id)));
      }

      ids.push(...recordIds);
      done = records.length < 1000;
    }

    return ids;
  }

  /** @private helper function for getIdsFromRequest */
  _getLoader(attrs, pageNo) {
    const { ResourcesGetter, HasManyGetter, getModelName } = this.Implementation;
    const modelName = getModelName(this.model);
    const { primaryKeys } = Schemas.schemas[modelName];

    const params = {
      ...this.params,
      ...attrs.allRecordsSubsetQuery, // Where does this comes from?
      restrictFieldsOnRootModel: true,
      fields: { [modelName]: primaryKeys.join(',') }, // load only ids
      page: { number: pageNo, size: 1000 }, // max batch size
    };

    if (attrs.parentCollectionName && attrs.parentCollectionId && attrs.parentAssociationName) {
      const parentModel = this.modelsManager.getModelByName(attrs.parentCollectionName);
      const parentParams = {
        ...params,
        recordId: attrs.parentCollectionId,
        associationName: attrs.parentAssociationName,
      };

      return new HasManyGetter(parentModel, this.model, this.lianaOptions, parentParams, this.user);
    }

    return new ResourcesGetter(this.model, this.lianaOptions, params, this.user);
  }
}

module.exports = RecordsGetter;
