function QueryDeserializer(attributes) {
  this.perform = () => {
    const {
      all_records: allRecords,
      all_records_ids_excluded: allRecordsIdsExcluded,
      all_records_subset_query: allRecordsSubsetQuery,
      parent_association_name: parentAssociationName,
      parent_collection_name: parentCollectionName,
      parent_collection_id: parentCollectionId,
      ...rest
    } = attributes;
    return {
      ...rest,
      allRecords,
      allRecordsIdsExcluded,
      allRecordsSubsetQuery,
      parentAssociationName,
      parentCollectionName,
      parentCollectionId,
    };
  };
}

module.exports = QueryDeserializer;
