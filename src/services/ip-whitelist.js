const errorMessages = require('../utils/error-messages');
const ipUtil = require('ip-utils');
const P = require('bluebird');
const _ = require('lodash');
const ForestServerRequester = require('./forest-server-requester');
const VError = require('verror');

let ipWhitelistRules = null;
let useIpWhitelist = true;

function retrieve(environmentSecret) {
  return new ForestServerRequester()
    .perform('/liana/v1/ip-whitelist-rules', environmentSecret)
    .then((responseBody) => {
      if (responseBody.data) {
        useIpWhitelist = responseBody.data.attributes.use_ip_whitelist;
        ipWhitelistRules = responseBody.data.attributes.rules;
      } else {
        return P.reject(new Error(`IP Whitelist: ${errorMessages.SERVER_TRANSACTION.UNEXPECTED}`));
      }
    })
    .catch(error => P.reject(new VError(error, 'IP Whitelist error')));
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
