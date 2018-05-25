var ipWhitelistService = require('../services/ip-whitelist');
var httpError = require('http-errors');
var logger = require('../services/logger');

function createIpAuthorizer(environmentSecret) {
  return function ipAuthorizer(request, response, next) {
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

    if (!ipWhitelistService.isIpWhitelistRetrieved() || !ipWhitelistService.isIpValid(ip)) {
      return retrieveWhitelist(environmentSecret, ip, next);
    }

    return next();
  };
}

function retrieveWhitelist(environmentSecret, ip, next) {
  return ipWhitelistService
    .retrieve(environmentSecret)
    .then(() => {
      ipWhitelistService.isIpValid(ip)
        ? next()
        : next(httpError(403, 'IP address rejected (' + ip + ')'));
    })
    .catch((error) => {
      logger.error(error.message);
      next(httpError(403, 'IP whitelist not retrieved'));
    });
}

module.exports = createIpAuthorizer;
