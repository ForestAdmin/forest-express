const _ = require('lodash');

exports.getBelongsToAssociations = (schema) =>
  _.filter(
    schema.fields,
    (field) => field.reference && !_.isArray(field.type) && !field.isVirtual && !field.integration,
  );

exports.getHasManyAssociations = (schema) =>
  _.filter(
    schema.fields,
    (field) => _.isArray(field.type) && !field.isVirtual && !field.integration,
  );
