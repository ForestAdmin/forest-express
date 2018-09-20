const errorMessages = require('../utils/error-messages');
const ipUtil = require('ip-utils');
const P = require('bluebird');
const _ = require('lodash');
const forestServerRequester = require('./forest-server-requester');
const VError = require('verror');
const IpWhitelistDeserializer = require('../deserializers/ip-whitelist');

let ipWhitelistRules = null;
let useIpWhitelist = true;

function retrieve(environmentSecret) {
  return forestServerRequester
    .perform('/liana/v1/ip-whitelist-rules', environmentSecret)
    .then((responseBody) => {
      if (responseBody.data) {
        return new IpWhitelistDeserializer(responseBody.data).perform();
      } else {
        return P.reject(new Error(`IP Whitelist: ${errorMessages.SERVER_TRANSACTION.UNEXPECTED}`));
      }
    })
    .then((ipWhitelistData) => {
      useIpWhitelist = ipWhitelistData.useIpWhitelist;
      ipWhitelistRules = ipWhitelistData.rules;
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
