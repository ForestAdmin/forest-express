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

function getField(schema, fieldName) {
  const [fieldNameToSearch] = fieldName.split(':');

  return schema.fields.find((field) => field.field === fieldNameToSearch);
}
exports.getField = getField;

exports.isSmartField = (schema, fieldName) => {
  const fieldFound = getField(schema, fieldName);
  return !!fieldFound && !!fieldFound.isVirtual;
};

exports.getFieldType = (schema, fieldName) => {
  const fieldFound = getField(schema, fieldName);
  return fieldFound && fieldFound.type;
};
