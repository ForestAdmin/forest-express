class SmartActionHookService {
  constructor({ setFieldWidget, smartActionFieldValidator }) {
    this.setFieldWidget = setFieldWidget;
    this.smartActionFieldValidator = smartActionFieldValidator;
  }

  /**
   * Transform fields from an array to an object to ease usage in hook,
   * adds null value, prepare widgets.
   *
   * @param {*} fields A smart action field
   */
  getFieldsForUser(fields) {
    return fields.map((field) => {
      // Update widget from legacy to current format.
      this.setFieldWidget(field);
      if (field.value === undefined) field.value = null;
      return field;
    });
  }

  /**
   * Get the response from user-defined hook.
   *
   * @param {Function} hook the callback hook of the smart action.
   * @param {Array} fields the array of fields.
   * @param {Object} record the current record that has to be passed to load hook.
   */
  async getResponse(action, hook, fields, request, changedField = null) {
    const fieldsForUser = this.getFieldsForUser(fields);

    if (typeof hook !== 'function') throw new Error('hook must be a function');

    // Call the user-defined load hook.
    const result = await hook({ request, fields: fieldsForUser, changedField });

    if (!(result && Array.isArray(result))) {
      throw new Error('hook must return an array');
    }

    return result.map((field) => {
      this.smartActionFieldValidator.validateField(field, action.name);
      this.smartActionFieldValidator
        .validateFieldChangeHook(field, action.name, action.hooks?.change);

      if (field.value === undefined) field.value = null;

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

module.exports = SmartActionHookService;
