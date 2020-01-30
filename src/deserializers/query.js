function QueryDeserializer(attributes) {
  this.perform = () => ({
    ...attributes,
    areAllRecordsSelected: attributes.are_all_records_selected,
    excluded_ids: attributes.excluded_ids,
  });
}

module.exports = QueryDeserializer;
