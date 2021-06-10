const ipAddr = require('ipaddr.js');
const ipRegex = require('ip-regex');

function getIpFromRequest(request) {
  /** @type {string} */
  const forwardedAddresses = request.headers['x-forwarded-for'];
  const parsedIps = forwardedAddresses?.match(ipRegex());

  if (parsedIps?.length) {
    // If the ip chain contains multiple IPs, the last public IP from the chain is the only
    // one we can trust and it corresponds to real IP that contacted our own reverse proxy
    return parsedIps
      .reverse()
      .map((address) => address.trim())
      .find((address) => ipAddr.parse(address).range() !== 'private');
  }

  return request.connection.remoteAddress;
}


module.exports = getIpFromRequest;
