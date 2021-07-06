class SmartActionHookDeserializer {
  // eslint-disable-next-line class-methods-use-this
  deserialize(requestBody) {
    const {
      fields,
      changed_field: changedField,
    } = requestBody.data.attributes;

    return {
      fields,
      changedField,
    };
  }
}

module.exports = SmartActionHookDeserializer;
