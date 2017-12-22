const _ = require('lodash');

exports.getBelongsToAssociations = function getBelongsToAssociations(schema) {
  return _.filter(
    schema.fields,
    field => field.reference && !_.isArray(field.type) && !field.isVirtual && !field.integration,
  );
};

exports.getHasManyAssociations = function getHasManyAssociations(schema) {
  return _.filter(
    schema.fields,
    field => _.isArray(field.type) && !field.isVirtual && !field.integration,
  );
};
