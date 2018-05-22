const request = require('superagent');
const errorMessages = require('../utils/error-messages');
const ServiceUrlGetter = require('./service-url-getter');
const ipUtil = require('ip-utils');
const P = require('bluebird');
const _ = require('lodash');

let ipWhitelistRules = null;
let useIpWhitelist = true;

function retrieve(environmentSecret) {
  var urlService = new ServiceUrlGetter().perform();

  return new P(function (resolve) {
    request
      .get(urlService + '/liana/v1/ip-whitelist-rules')
      .set('forest-secret-key', environmentSecret)
      .end(function (error, result) {
        if (error) {
          return P.reject(error);
        }

        if (result.status === 200 && result.body && result.body.data) {
          useIpWhitelist = result.body.data.attributes.use_ip_whitelist;
          ipWhitelistRules = result.body.data.attributes.rules;
        } else {
          if (result.status === 0) {
            // TODO: reject ?
            P.reject(errorMessages.SERVER_TRANSACTION.SERVER_DOWN);
          } else if (result.status === 404 || result.status === 422) {
            P.reject(errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND);
          } else {
            P.reject(errorMessages.SERVER_TRANSACTION.UNEXPECTED, error);
          }
        }
        resolve();
      });
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
