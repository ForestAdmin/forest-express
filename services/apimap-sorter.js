'use strict';

function ApimapSorter(apimap) {

  apimap.data = apimap.data.sort(function (c1, c2) {
    return c1.id < c2.id;
  });

  apimap.included = apimap.included.sort(function (c1, c2) {
    return c1.id < c2.id;
  });

  return apimap;
}

module.exports = ApimapSorter;
