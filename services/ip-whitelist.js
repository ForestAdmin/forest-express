'use strict';
var request = require('superagent');
var errorMessages = require('../utils/error-messages');
var ServiceUrlGetter = require('./service-url-getter');
var ipUtil = require('ip-utils');
var P = require('bluebird');
var _ = require('lodash');

var ipWhitelistRules = null;
var useIpWhitelist = true;

function retrieve(environmentSecret) {
  var urlService = new ServiceUrlGetter().perform();

  return new P(function (resolve) {
    request
      .get(urlService + '/liana/ip-whitelist-rules')
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
            P.reject(errorMessages.IP_WHITELIST.SERVER_DOWN);
          } else if (result.status === 404 || result.status === 422) {
            P.reject(errorMessages.IP_WHITELIST.SECRET_NOT_FOUND);
          } else {
            P.reject(errorMessages.IP_WHITELIST.UNEXPECTED, error);
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
