class SmartActionHookDeserializer {
  // eslint-disable-next-line class-methods-use-this
  deserialize(requestBody) {
    const {
      collection_name: collectionName,
      ids: recordIds,
      fields,
      changed_field: changedField,
    } = requestBody.data.attributes;

    return {
      collectionName,
      recordIds,
      fields,
      changedField,
    };
  }
}

module.exports = SmartActionHookDeserializer;
