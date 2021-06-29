const _ = require('lodash');

// Notice: borrowed from forestadmin-server
function formatDefaultValue(fieldType, defaultValue) {
  if (fieldType === 'Json') {
    if ([null, undefined].includes(defaultValue)) {
      return null;
    }
    return JSON.stringify(defaultValue);
  }

  return _.toString(defaultValue);
}

module.exports = formatDefaultValue;
