/**
 * Check if two objects have the same structure.
 * See: https://github.com/ForestAdmin/forest-express/pull/546#discussion_r530205698
 *
 * @param {Object} object the first object to compare
 * @param {Object} other the second object to compare
 * @param {Number} deep comparison level (deepness)
 * @param {Number} step current step (internal var)
 * @returns {Boolean}
 */
function isSameDataStructure(object, other, deep = 0, step = 0) {
  if (!object
    || !other
    || !(typeof object === 'object' && typeof other === 'object')) {
    return false;
  }

  const objectKeys = Object.keys(object);
  const otherKeys = Object.keys(other);
  if (objectKeys.length !== otherKeys.length) {
    return false;
  }

  const objectKeysSet = new Set(objectKeys);

  // eslint-disable-next-line no-restricted-syntax
  for (const key of otherKeys) {
    // If key does not exist in other object or by its children.
    if (!objectKeysSet.has(key)
      || (step + 1 <= deep
        && !isSameDataStructure(object[key], other[key], deep, step + 1))) {
      return false;
    }
  }

  return true;
}

module.exports = isSameDataStructure;
