function QueryDeserializer(attributes) {
  this.perform = () => ({
    ...attributes,
    allRecords: attributes.all_records,
    allRecordsIdsExcluded: attributes.all_records_ids_excluded,
    allRecordsSubsetQuery: attributes.all_records_subset_query,
    parentAssociationName: attributes.parent_association_name,
    parentCollectionName: attributes.parent_collection_name,
    parentCollectionId: attributes.parent_collection_id,
  });
}

module.exports = QueryDeserializer;
