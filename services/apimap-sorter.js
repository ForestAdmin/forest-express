'use strict';
var _ = require('lodash');

function order(object) {
  var sortedObject = {};

  _.each(_.sortBy(Object.keys(object)), function(key) {
    sortedObject[key] = object[key];
  });

  return sortedObject;
}

function ApimapSorter(apimap) {
  apimap.data = _.sortBy(apimap.data, ['type', 'id']);

  _.each(apimap.data, function (data) {
    data.attributes = order(data.attributes);
    data.fields = _.sortBy(apimap.fields, ['field', 'type']);
  });

  if (apimap.included) {
    apimap.included = _.sortBy(apimap.included, ['type', 'id']);
  }

  apimap.meta = order(apimap.meta);

  return apimap;
}

module.exports = ApimapSorter;
