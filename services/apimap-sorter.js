'use strict';
var _ = require('lodash');

function sortObjectKeys(object) {
  var sortedObject = {};

  _.each(_.sortBy(Object.keys(object)), function(key) {
    sortedObject[key] = object[key];
  });

  return sortedObject;
}

function ApimapSorter(apimap) {
  apimap.data = _.sortBy(apimap.data, ['type', 'id']);

  _.each(apimap.data, function (data) {
    data.attributes = sortObjectKeys(data.attributes);
    data.attributes.fields = _.sortBy(data.attributes.fields, ['field', 'type']);
  });

  if (apimap.included) {
    apimap.included = _.sortBy(apimap.included, ['type', 'id']);

    _.each(apimap.included, function (include) {
      include.attributes = sortObjectKeys(include.attributes);
    });
  }

  apimap.meta = sortObjectKeys(apimap.meta);

  return apimap;
}

module.exports = ApimapSorter;
