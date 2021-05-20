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

  // eslint-disable-next-line class-methods-use-this
  validateFieldChangeHook(field, actionName, hooks = {}) {
    if (field.hook && !hooks[field.hook]) {
      throw new Error(`The hook "${field.hook}" of "${field.field}" field on the smart action "${actionName}" is not defined.`);
    }
  }

  validateSmartActionFields(action, collectionName) {
    if (!action.fields) return;

    if (!Array.isArray(action.fields)) {
      throw new Error(`Cannot find the fields you defined for the Smart action "${action.name}" of your "${collectionName}" collection. The fields option must be an array.`);
    }

    action.fields.forEach((field) => {
      this.validateField(field);
      this.validateFieldChangeHook(field, action.name, action.hooks?.change);
    });
  }
}

module.exports = SmartActionFieldValidator;
