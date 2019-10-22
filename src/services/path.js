exports.base = (withPrefix = true) => {
  const base = '/:teamName/';
  return withPrefix ? `/forest${base}` : base;
};

exports.generate = (path, options) => {
  const pathPrefix = exports.base(!options.expressParentApp);
  return pathPrefix + path;
};

exports.generateForSmartActionCustomEndpoint = (path, options) => {
  if (options.expressParentApp) {
    return path.replace(/^\/?forest\//, '/');
  }

  // NOTICE: Automatically fix missing / character at the beginning at the endpoint declaration.
  return path[0] === '/' ? path : `/${path}`;
};
