const { pick } = require('lodash');
const AbstractRecordService = require('./abstract-records-service');
const ParamsFieldsDeserializer = require('../../deserializers/params-fields');
const Schemas = require('../../generators/schemas');
const QueryDeserializer = require('../../deserializers/query');

class RecordsGetter extends AbstractRecordService {
  /**
   * @param extraParams Deprecated. Should be removed for forest-express@10
   */
  async getAll(extraParams = {}) {
    const { ResourcesGetter } = this.Implementation;

    // Load records
    const params = { ...this.params, ...extraParams };
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
   * @fixme why are we testing for attrs?.allRecords !== true && attrs.ids to detect "all records"
   *        queries? IMHO this should be only attrs?.allRecords
   *
   * @fixme Composite ids are returned separated by a dash "-".
   *        Not sure why, we are using pipes "|" in forest-express-sequelize but changing it
   *        would be a breaking change.
   */
  async getIdsFromRequest(request) {
    const attrs = new QueryDeserializer(request?.body?.data?.attributes ?? {}).perform();
    const idsExcludedAsString = attrs?.allRecordsIdsExcluded?.map?.(String) ?? [];

    // "select all records" is not selected
    if (attrs?.allRecords !== true && attrs.ids) {
      return attrs.ids;
    }

    // Otherwise, query database in a loop to retrieve all ids.
    const ids = [];
    const pageSize = 1000;
    for (let pageNo = 1, done = false; !done; pageNo += 1) {
      // eslint-disable-next-line no-await-in-loop
      const records = await this._loadPage(attrs, pageNo, pageSize);
      const recordIds = records
        .map((record) => this._extractPackedPrimaryKey(record))
        .filter((id) => !idsExcludedAsString.includes(String(id)));

      ids.push(...recordIds);
      done = records.length < pageSize;
    }

    return ids;
  }

  /** @private helper function for getIdsFromRequest */
  async _loadPage(attrs, pageNo, pageSize) {
    const { ResourcesGetter, HasManyGetter, getModelName } = this.Implementation;
    const { primaryKeys } = Schemas.schemas[getModelName(this.model)];

    const params = {
      // Drop sorting, which may slow down the request + other invalid params.
      ...pick(this.params, ['filters', 'search', 'searchExtended', 'timezone']),
      ...pick(attrs.allRecordsSubsetQuery, ['filters', 'search', 'searchExtended', 'timezone']),
      page: { number: pageNo, size: pageSize },

      // We only need the primary keys
      restrictFieldsOnRootModel: true,
      fields: { [getModelName(this.model)]: primaryKeys.join(',') },
    };

    let loader = new ResourcesGetter(this.model, this.lianaOptions, params, this.user);
    if (attrs.parentCollectionName && attrs.parentCollectionId && attrs.parentAssociationName) {
      const newModel = this.modelsManager.getModelByName(attrs.parentCollectionName);
      const newParams = {
        ...params,
        recordId: attrs.parentCollectionId,
        associationName: attrs.parentAssociationName,
      };

      loader = new HasManyGetter(newModel, this.model, this.lianaOptions, newParams, this.user);
    }

    return (await loader.perform())[0];
  }

  /** @private helper function for getIdsFromRequest */
  _extractPackedPrimaryKey(record) {
    const { getModelName } = this.Implementation;
    const { primaryKeys } = Schemas.schemas[getModelName(this.model)];

    return primaryKeys.map((primaryKey) => record[primaryKey]).join('-');
  }
}

module.exports = RecordsGetter;
