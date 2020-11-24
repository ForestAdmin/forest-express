/**
   * Compare two sets of objects keys, returns true if both have the same keys.
   * An error has to be thrown in HookLoad.getResponse() when a field is deleted or added
   * (new key or missing key in fields).
   * Source: https://stackoverflow.com/a/35047888/978690
   *
   * @param  {...any} objects The list of fields object we want to compare
   * @see HookLoad.getResponse() for usage
 */
function objectsHaveSameKeys(...objects) {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every((object) => union.size === Object.keys(object).length);
}

module.exports = objectsHaveSameKeys;
