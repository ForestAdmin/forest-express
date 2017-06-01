'use strict';
var _ = require('lodash');

exports.getHasManyAssociations = function (schema) {
  return _.filter(schema.fields, function (field) {
    return _.isArray(field.type) && !field.isVirtual && !field.integration;
  });
};
