

exports.generate = function (path, opts) {
  const pathPrefix = opts.expressParentApp ? '/' : '/forest/';
  return pathPrefix + path;
};
