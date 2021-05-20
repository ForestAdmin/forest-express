class SmartActionFieldValidator {
  validFieldPrimitifType = [
    'String',
    'Number',
    'Date',
    'Boolean',
    'File',
    'Enum',
    'Json',
    'Dateonly',
  ];

  validFieldArrayType = [
    'String',
    'Number',
    'Date',
    'boolean',
    'File',
    'Enum',
  ];

  validateField(field) {
    if (!field || Array.isArray(field) || typeof field !== 'object') throw new Error('Field must be an object.');

    const {
      field: fieldName,
      description,
      enums,
      isRequired,
      isReadOnly,
      reference,
      type,
    } = field;

    if (!fieldName) throw new Error('field attribute must be defined.');

    if (typeof fieldName !== 'string') throw new Error('field attribute must be a string.');

    if (description && typeof description !== 'string') throw new Error(`description of "${fieldName}" must be a string.`);

    if (enums && !Array.isArray(enums)) throw new Error(`enums of "${fieldName}" must be an array.`);

    if (isRequired && typeof isRequired !== 'boolean') throw new Error(`isRequired of "${fieldName}" must be a boolean.`);

    if (isReadOnly && typeof isReadOnly !== 'boolean') throw new Error(`isReadOnly of "${fieldName}" must be a boolean.`);

    if (reference && typeof reference !== 'string') throw new Error(`reference of "${fieldName}" must be a string.`);

    if (type !== undefined && (Array.isArray(type)
      ? !this.validFieldArrayType.includes(type[0])
      : !this.validFieldPrimitifType.includes(type))
    ) {
      throw new Error(`type of "${fieldName}" must be a valid type. See the documentation for more information. https://docs.forestadmin.com/documentation/reference-guide/fields/create-and-manage-smart-fields#available-field-options`);
    }
  }
}

module.exports = SmartActionFieldValidator;
