exports.generate = (path, options) => {
  const pathPrefix = options.expressParentApp ? '/' : '/forest/';
  return pathPrefix + path;
};

exports.generateForInit = (path, options) => {
  if (options.expressParentApp) return `/${path}`;

  const pathPrefix = '/forest';
  return [`${pathPrefix}`, `${pathPrefix}/${path}`];
};

exports.generateForSmartActionCustomEndpoint = (path, options) => {
  if (options.expressParentApp) {
    return path.replace(/^\/?forest\//, '/');
  }

  // NOTICE: Automatically fix missing / character at the beginning at the endpoint declaration.
  return path[0] === '/' ? path : `/${path}`;
};
