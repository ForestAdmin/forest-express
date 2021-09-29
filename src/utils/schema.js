const _ = require('lodash');
const context = require('../context');

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

exports.getSmartField = (schema, fieldName) => {
  const field = getField(schema, fieldName);
  if (!field) return null;

  // If the field is not virtual but the field requested is something like "myField:nestedField"
  // then we want to retrieve nestedField to check if nestedField isVirtual
  if (!field.isVirtual && fieldName.includes(':') && field.reference) {
    const [referencedModel] = field.reference.split('.');
    const { schemasGenerator } = context.inject();
    const referenceSchema = schemasGenerator.schemas[referencedModel];
    return exports.getSmartField(referenceSchema, fieldName.substring(fieldName.indexOf(':') + 1));
  }

  return field.isVirtual ? field : null;
};

exports.isSmartField = (schema, fieldName) => {
  const fieldFound = exports.getSmartField(schema, fieldName);
  return !!fieldFound && !!fieldFound.isVirtual;
};

exports.getFieldType = (schema, fieldName) => {
  const fieldFound = getField(schema, fieldName);
  return fieldFound && fieldFound.type;
};
