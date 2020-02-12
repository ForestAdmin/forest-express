function QueryDeserializer(attributes) {
  this.perform = () => ({
    ...attributes,
    allRecords: attributes.all_records,
    allRecordsIdsExcluded: attributes.all_records_ids_excluded,
    allRecordsSubsetQuery: attributes.all_records_subset_query,
  });
}

module.exports = QueryDeserializer;
