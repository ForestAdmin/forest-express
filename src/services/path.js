exports.generate = (path, options) => {
  var pathPrefix = options.expressParentApp ? '/' : '/forest/';
  return pathPrefix + path;
};

exports.generateForSmartActionCustomEndpoint = (path, options) => {
  if (options.expressParentApp) {
    return path.replace(/^\/forest/, '');
  }

  return path;
};
