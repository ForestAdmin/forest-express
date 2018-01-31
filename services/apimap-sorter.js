'use strict';
var _ = require('lodash');

function ApimapSorter(apimap) {
  apimap.data = _.sortBy(apimap.data, ['type', 'id']);

  _.each(apimap.data, function (data) {
    data.fields = _.sortBy(apimap.fields, ['field', 'type']);
  });

  if (apimap.included) {
    apimap.included = _.sortBy(apimap.included, ['type', 'id']);
  }

  return apimap;
}

module.exports = ApimapSorter;
