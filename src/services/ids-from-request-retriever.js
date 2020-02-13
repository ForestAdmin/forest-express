const QueryDeserializer = require('../deserializers/query');

const BATCH_PAGE_SIZE = 100;

function IdsFromRequestRetriever(recordsGetter, recordsCounter, primaryKeys) {
  this.perform = async (params) => {
    const hasBodyAttributes = params.body && params.body.data && params.body.data.attributes;

    const attributes = hasBodyAttributes
      && new QueryDeserializer(params.body.data.attributes).perform();

    const isSelectAllRecordsQuery = hasBodyAttributes
      && attributes.allRecords === true;

    // NOTICE: If it is not a "select all records" query and it receives a list of ID.
    if (!isSelectAllRecordsQuery && attributes.ids) {
      return attributes.ids;
    }

    // NOTICE: Build id from primary keys (there can be multiple primary keys).
    //         See: https://github.com/ForestAdmin/forest-express-sequelize/blob/42283494de77c9cebe96adbe156caa45c86a80fa/src/services/composite-keys-manager.js#L24-L40
    const getId = (record) => (
      // NOTICE: Primary keys are not available in mongoose schemas.
      primaryKeys ? primaryKeys.map((primaryKey) => record[primaryKey]).join('-') : record._id
    );

    // NOTICE: Get records count
    const recordsCount = await recordsCounter(attributes);

    // NOTICE: records IDs are returned with a batch.
    const recordsIds = await Array.from({ length: Math.ceil(recordsCount / BATCH_PAGE_SIZE) })
      .reduce(async (accumulator, _, index) => {
        const currentRecords = await recordsGetter({
          ...attributes.allRecordsSubsetQuery,
          page: { number: `${index + 1}`, size: `${BATCH_PAGE_SIZE}` },
        });
        return [...await accumulator, ...currentRecords.map((record) => getId(record))];
      }, []);

    // NOTICE: remove excluded IDs.
    if (attributes.allRecordsIdsExcluded) {
      // NOTICE: Ensure that IDs are comparables (avoid ObjectId or Integer issues).
      const idsExcludedAsString = attributes.allRecordsIdsExcluded.map(String);
      return recordsIds.filter((id) => !idsExcludedAsString.includes(String(id)));
    }

    return recordsIds;
  };
}

module.exports = IdsFromRequestRetriever;
