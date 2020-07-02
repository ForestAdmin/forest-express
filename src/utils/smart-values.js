const _ = require('lodash');

function _recursivelyAddSmartValues(record) {
  if (record.smartValues) {
    _.each(Object.keys(record.smartValues), (key) => {
      record[key] = record.smartValues[key];
      _recursivelyAddSmartValues(record[key]);
    });
  }
}

exports.recursivelyAddSmartValues = _recursivelyAddSmartValues;
