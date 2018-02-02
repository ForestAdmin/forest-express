'use strict';

function ParamsFieldsDeserializer(paramsFields) {
  this.perform = function () {
    return Object.keys(paramsFields).reduce(function (fields, modelName) {
      fields[modelName] = paramsFields[modelName].split(',');
      return fields;
    }, {});
  };
}

module.exports = ParamsFieldsDeserializer;
