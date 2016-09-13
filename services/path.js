'use strict';

exports.generate = function (path, opts) {
  var pathPrefix = opts.expressParentApp ? '/' : '/forest/';
  return pathPrefix + path;
};
