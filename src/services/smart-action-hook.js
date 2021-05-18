class SmartActionHook {
  constructor({ isSameDataStructure, setFieldWidget }) {
    this.isSameDataStructure = isSameDataStructure;
    this.setFieldWidget = setFieldWidget;

    this.validFieldPrimitifType = [
      'String',
      'Number',
      'Date',
      'Boolean',
      'File',
      'Enum',
      'Json',
      'Dateonly',
    ];

    this.validFieldArrayType = [
      'String',
      'Number',
      'Date',
      'boolean',
      'File',
      'Enum',
    ];
  }

  /**
   * Transform fields from an array to an object to ease usage in hook,
   * adds null value, prepare widgets.
   *
   * @param {*} fields A smart action field
   */
  getFieldsForUser(fields) {
    return fields.map((field) => {
      this.setFieldWidget(field);
      if (field.value === undefined) field.value = null;
      return field;
    });
  }

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

    if (reference && typeof reference !== 'string') throw new Error(`reference of "${fieldName}" should be a string.`);

    if (Array.isArray(type)
      ? !this.validFieldArrayType.includes(type[0])
      : !this.validFieldPrimitifType.includes(type)
    ) {
      throw new Error(`type of "${fieldName}" must be a valid type. See the documentation for more information. https://docs.forestadmin.com/documentation/reference-guide/fields/create-and-manage-smart-fields#available-field-options`);
    }
  }

  /**
   * Get the response from user-defined hook.
   *
   * @param {Function} hook the callback hook of the smart action.
   * @param {Array} fields the array of fields.
   * @param {Object} record the current record that has to be passed to load hook.
   */
  async getResponse(hook, fields, record, changedField = null) {
    const fieldsForUser = this.getFieldsForUser(fields);

    if (typeof hook !== 'function') throw new Error('hook must be a function');

    // Call the user-defined load hook.
    const result = await hook({ record, fields: fieldsForUser, changedField });

    if (!(result && Array.isArray(result))) {
      throw new Error('hook must return an array');
    } else if (!this.isSameDataStructure(fieldsForUser, result, 1)) {
      throw new Error('fields must be unchanged (no addition nor deletion allowed)');
    }

    return result.map((field) => {
      this.validateField(field);
      // Reset `value` when not present in `enums` (which means `enums` has changed).
      if (Array.isArray(field.enums)) {
        // `Value` can be an array if the type of fields is `[x]`
        if (Array.isArray(field.type)
          && Array.isArray(field.value)
          && field.value.some((value) => !field.enums.includes(value))) {
          return { ...field, value: null };
        }

        // `Value` can be any other value
        if (!Array.isArray(field.type) && !field.enums.includes(field.value)) {
          return { ...field, value: null };
        }
      }

      return field;
    });
  }
}

module.exports = SmartActionHook;
