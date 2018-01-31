'use strict';
var _ = require('lodash');

function ApimapSorter(apimap) {
  apimap.data = _.sortBy(apimap.data, ['id']);

  if (apimap.included) {
    apimap.included = _.sortBy(apimap.included, ['id']);
  }

  return apimap;
}

module.exports = ApimapSorter;
