function FieldsParamsDeserializer(fields) {
  this.perform = function () {
    return Object.keys(fields).reduce(function (acc, modelKey) {
      acc[modelKey] = fields[modelKey].split(',');
      return acc;
    }, {});
  };
}

module.exports = FieldsParamsDeserializer;
