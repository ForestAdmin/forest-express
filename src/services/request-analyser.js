class RequestAnalyzerService {
  /**
   * @private @static
   * @param {string} host
   * @returns {number|undefined}
   */
  static _extractPortFromHost(host) {
    if (!host || !host.includes(':')) {
      return undefined;
    }

    return Number(host.replace(/^.*:/, ''));
  }

  /**
   * @param {import('express').Request} request
   * @returns {string}
   */
  // eslint-disable-next-line class-methods-use-this
  extractOriginalUrlWithoutQuery(request) {
    const isForwarded = Boolean(request.headers['x-forwarded-host']);
    const protocol = request.headers['x-forwarded-proto']
      || request.protocol;
    const hostname = request.headers['x-forwarded-host']
      || request.hostname;
    const port = request.headers['x-forwarded-port']
      || (isForwarded
        ? undefined
        : RequestAnalyzerService._extractPortFromHost(request.headers.host));
    const path = request.url;

    return `${protocol}://${hostname}${port ? `:${port}` : ''}${path}`;
  }
}

module.exports = RequestAnalyzerService;
