class SmartActionHook {
  constructor({ isSameDataStructure, setFieldWidget }) {
    this.isSameDataStructure = isSameDataStructure;
    this.setFieldWidget = setFieldWidget;
  }

  /**
   * Transform fields from an array to an object to ease usage in hook,
   * adds null value, prepare widgets.
   *
   * @param {*} fields A smart action field
   */
  getFieldsForUser(fields) {
    return fields.reduce((previous, current) => {
      // Update widget from legacy to current format.
      this.setFieldWidget(current);
      // Return the field(with a default value to null when none is provided.
      return {
        ...previous,
        [current.field]: { value: null, ...current },
      };
    }, {});
  }

  /**
   * Get the response from user-defined hook.
   *
   * @param {Function} hook the callback hook of the smart action.
   * @param {Array} fields the array of fields.
   * @param {Object} record the current record that has to be passed to load hook.
   */
  async getResponse(hook, fields, record) {
    const fieldsForUser = this.getFieldsForUser(fields);

    if (typeof hook !== 'function') throw new Error('hook must be a function');

    // Call the user-defined load hook.
    const result = await hook({ record, fields: fieldsForUser });

    if (!(result && typeof result === 'object')) {
      throw new Error('hook must return an object');
    } else if (!this.isSameDataStructure(fieldsForUser, result, 1)) {
      throw new Error('fields must be unchanged (no addition nor deletion allowed)');
    }

    // Apply result on fields (transform the object back to an array), preserve order.
    return fields.map((field) => result[field.field]);
  }
}

module.exports = SmartActionHook;
