const errorMessages = require('../utils/error-messages');
const ipUtil = require('ip-utils');
const P = require('bluebird');
const _ = require('lodash');
const ForestServerRequester = require('./forest-server-requester');

let ipWhitelistRules = null;
let useIpWhitelist = true;

function retrieve(environmentSecret) {
  return new ForestServerRequester()
    .perform(environmentSecret, '/liana/v1/ip-whitelist-rules')
    .then((responseBody) => {
      if (responseBody.data) {
        useIpWhitelist = responseBody.data.attributes.use_ip_whitelist;
        ipWhitelistRules = responseBody.data.attributes.rules;
      } else {
        return P.reject(`IP Whitelist: ${errorMessages.SERVER_TRANSACTION.UNEXPECTED}`);
      }
    });
}

function isIpWhitelistRetrieved() {
  return !useIpWhitelist || ipWhitelistRules !== null;
}

function isIpValid(ip) {
  if (useIpWhitelist) {
    return _.some(ipWhitelistRules, function (rule) {
      return ipUtil.isIpMatchesRule(ip, rule);
    });
  }

  return true;
}

module.exports = {
  retrieve: retrieve,
  isIpValid: isIpValid,
  isIpWhitelistRetrieved: isIpWhitelistRetrieved,
};
