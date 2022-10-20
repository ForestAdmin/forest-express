const P = require('bluebird');
const _ = require('lodash');
const ipUtil = require('forest-ip-utils');
const logger = require('./logger');
const errorMessages = require('../utils/error-messages');
const forestServerRequester = require('./forest-server-requester');
const IpWhitelistDeserializer = require('../deserializers/ip-whitelist');

let ipWhitelistRules = null;
let useIpWhitelist = true;

function retrieve(environmentSecret) {
  return forestServerRequester
    .perform('/liana/v1/ip-whitelist-rules', environmentSecret)
    .then((responseBody) => {
      if (responseBody.data) {
        return new IpWhitelistDeserializer(responseBody.data).perform();
      }
      return P.reject(new Error(`IP Whitelist: ${errorMessages.SERVER_TRANSACTION.UNEXPECTED}`));
    })
    .then((ipWhitelistData) => {
      useIpWhitelist = ipWhitelistData.useIpWhitelist;
      ipWhitelistRules = ipWhitelistData.rules;
    })
    .catch((error) => {
      logger.error('An error occurred while retrieving your IP whitelist. Your Forest envSecret seems to be missing or unknown. Can you check that you properly set your Forest envSecret in the Forest initializer?');
      return P.reject(new Error('IP Whitelist error', error));
    });
}

function isIpWhitelistRetrieved() {
  return !useIpWhitelist || ipWhitelistRules !== null;
}

function isIpValid(ip) {
  if (useIpWhitelist) {
    return _.some(ipWhitelistRules, (rule) => ipUtil.isIpMatchesRule(ip, rule));
  }

  return true;
}

module.exports = {
  retrieve,
  isIpValid,
  isIpWhitelistRetrieved,
};
