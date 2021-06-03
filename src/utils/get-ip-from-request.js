const ipAddr = require('ipaddr.js');

function getIpFromRequest(request) {
  /** @type {string} */
  const forwardedAddresses = request.headers['x-forwarded-for'];

  if (forwardedAddresses) {
    // If the ip chain contains multiple IPs, the last public IP from the chain is the only
    // one we can trust and it corresponds to real IP that contacted our own reverse proxy
    return forwardedAddresses.split(',')
      .reverse()
      .map((address) => address.trim())
      .find((address) => ipAddr.parse(address).range() !== 'private');
  }

  return request.connection.remoteAddress;
}


module.exports = getIpFromRequest;
