class HookLoad {
  constructor({ objectsHaveSameKeys }) {
    this.objectsHaveSameKeys = objectsHaveSameKeys;
  }

  /**
   * Get the response from user-defined load hook.
   *
   * @param {Function} hook the callback load hook of the smart action.
   * @param {Object} record the current record that has to be passed to load hook
   * @param {Array} fields the array of fields.
   */
  async getResponse(hook, record, fields) {
    // Transform incomming fields from array to an object to ease usage in hook.
    const fieldsAsObject = Object.fromEntries(
      fields.map((field) => [field.field, { ...field, value: null }]),
    );

    if (typeof hook !== 'function') throw new Error('load must be a function');

    // Call the user-defined load hook.
    const result = await hook({ record, fields: fieldsAsObject });

    if (!(result && typeof result === 'object')) {
      throw new Error('load hook must return an object');
    } else if (!this.objectsHaveSameKeys(result, fieldsAsObject)) {
      throw new Error('fields must be unchanged (no addition nor deletion allowed)');
    }

    // Apply result on fields (transform the object back to an array), preserve order.
    return fields.map((field) => result[field.field]);
  }
}

module.exports = HookLoad;
