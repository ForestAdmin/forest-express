class SmartActionHook {
  constructor({ isSameDataStructure }) {
    this.isSameDataStructure = isSameDataStructure;
  }

  /**
   * Get the response from user-defined hook.
   *
   * @param {Function} hook the callback hook of the smart action.
   * @param {Object} record the current record that has to be passed to load hook
   * @param {Array} fields the array of fields.
   */
  async getResponse(hook, record, fields) {
    // Transform fields from array to an object to ease usage in hook, adds null value.
    const fieldsForUser = fields.reduce((previous, current) => ({
      ...previous,
      [current.field]: { ...current, value: null },
    }), {});

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
