function QueryDeserializer(attributes) {
  this.perform = () => ({
    ...attributes,
    areAllRecordsSelected: attributes.are_all_records_selected,
    idsExcluded: attributes.ids_excluded,
  });
}

module.exports = QueryDeserializer;
