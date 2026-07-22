const net = require('net');
const P = require('bluebird');
const _ = require('lodash');
const VError = require('verror');
const logger = require('./logger');
const errorMessages = require('../utils/error-messages');
const forestServerRequester = require('./forest-server-requester');
const IpWhitelistDeserializer = require('../deserializers/ip-whitelist');

const RULE_TYPE_IP = 0;
const RULE_TYPE_RANGE = 1;
const RULE_TYPE_SUBNET = 2;

let ipWhitelistRules = null;
let useIpWhitelist = true;

function familyOf(ip) {
  return net.isIP(ip) === 6 ? 'ipv6' : 'ipv4';
}

function isIpMatchesRule(ip, rule) {
  if (!net.isIP(ip)) return false;

  const blockList = new net.BlockList();
  switch (rule.type) {
    case RULE_TYPE_IP:
      blockList.addAddress(rule.ip, familyOf(rule.ip));
      break;
    case RULE_TYPE_RANGE:
      blockList.addRange(rule.ipMinimum, rule.ipMaximum, familyOf(rule.ipMinimum));
      break;
    case RULE_TYPE_SUBNET: {
      const [address, prefix] = rule.range.split('/');
      blockList.addSubnet(address, parseInt(prefix, 10), familyOf(address));
      break;
    }
    default:
      throw new Error('Invalid rule type');
  }

  return blockList.check(ip, familyOf(ip));
}

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
      logger.error(`An error occured while retrieving your IP whitelist. Your Forest envSecret may be missing or unknown. Can you check that you properly set your Forest envSecret in the Forest initializer? ${error.message}`);
      return P.reject(new VError('IP Whitelist error', error));
    });
}

function isIpWhitelistRetrieved() {
  return !useIpWhitelist || ipWhitelistRules !== null;
}

function isIpValid(ip) {
  if (useIpWhitelist) {
    return _.some(ipWhitelistRules, (rule) => isIpMatchesRule(ip, rule));
  }

  return true;
}

module.exports = {
  retrieve,
  isIpValid,
  isIpWhitelistRetrieved,
};
