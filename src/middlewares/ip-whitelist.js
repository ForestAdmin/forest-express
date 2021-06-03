const httpError = require('http-errors');
const ipWhitelistService = require('../services/ip-whitelist');
const getIpFromRequest = require('../utils/get-ip-from-request');

function retrieveWhitelist(environmentSecret, ip, next) {
  return ipWhitelistService
    .retrieve(environmentSecret)
    .then(() => (ipWhitelistService.isIpValid(ip) ? next() : next(httpError(403, `IP address rejected (${ip})`))))
    .catch(() => next(httpError(403, 'IP whitelist not retrieved')));
}

function createIpAuthorizer(environmentSecret) {
  return function ipAuthorizer(request, response, next) {
    const ip = getIpFromRequest(request);

    if (!ipWhitelistService.isIpWhitelistRetrieved() || !ipWhitelistService.isIpValid(ip)) {
      return retrieveWhitelist(environmentSecret, ip, next);
    }

    return next();
  };
}

module.exports = createIpAuthorizer;
