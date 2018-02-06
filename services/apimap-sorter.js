'use strict';
var _ = require('lodash');

function sortObjectKeys(object) {
  var sortedObject = {};

  _.each(_.sortBy(Object.keys(object)), function(key) {
    sortedObject[key] = object[key];
  });

  return sortedObject;
}

function sortData(object) {
  var sortedObject = {
    type: object.type,
    id: object.id,
    attributes: object.attributes,
  };

  return Object.assign(sortedObject, object);
}

function ApimapSorter(apimap) {
  apimap = sortObjectKeys(apimap);
  apimap.data = _.sortBy(apimap.data, ['type', 'id']);

  apimap.data = apimap.data.map(function (data) {
    data.attributes = sortObjectKeys(data.attributes);
    data.attributes.fields = _.sortBy(data.attributes.fields, ['field', 'type']);
    data = sortData(data);
    return data;
  });

  if (apimap.included) {
    apimap.included = _.sortBy(apimap.included, ['type', 'id']);

    _.each(apimap.included, function (include) {
      include = sortData(include);
      include.attributes = sortObjectKeys(include.attributes);
    });
  }

  apimap.meta = sortObjectKeys(apimap.meta);

  return apimap;
}

module.exports = ApimapSorter;
