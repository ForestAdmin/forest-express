function ParamsFieldsDeserializer(paramsFields) {
  this.perform = () => {
    if (paramsFields) {
      return Object.keys(paramsFields).reduce((fields, modelName) => {
        const value = paramsFields[modelName];

        if (Array.isArray(value)) {
          // NOTICE: Some callers (e.g. collections with a composite primary key
          //         requested through the workflow executor) serialize fields as
          //         `fields[model][]=a&fields[model][]=b`, which qs parses into an
          //         array instead of a comma-separated string. Entries may still
          //         contain commas, so re-split and flatten them.
          fields[modelName] = value.flatMap((entry) =>
            (typeof entry === 'string' ? entry.split(',') : entry));
        } else if (typeof value === 'string') {
          fields[modelName] = value.split(',');
        } else {
          // NOTICE: Unexpected shape: keep as-is rather than throwing.
          fields[modelName] = value;
        }

        return fields;
      }, {});
    }
    return null;
  };
}

module.exports = ParamsFieldsDeserializer;
