'use strict';
var P = require('bluebird');
var request = require('superagent');
var logger = require('./logger');
var errorMessages = require('../utils/error-messages');

function GoogleAuthorizationFinder(renderingId, forestToken, opts) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      request
        .get(opts.forestUrl + '/forest/renderings/' + renderingId + '/google-authorization')
        .set('forest-secret-key', opts.envSecret)
        .set('forest-token', forestToken)
        .end(function (error, result) {
          if (result.status === 200 && result.body && result.body.data) {
            resolve(result.body.data);
          } else {
            if (result.status === 0) {
              logger.error(errorMessages.SESSION.SERVER_DOWN);
            } else if (result.status === 404) {
              logger.error(errorMessages.SESSION.SECRET_NOT_FOUND);
            } else if (result.status === 422) {
              logger.error(errorMessages.SESSION.SECRET_AND_RENDERINGID_INCONSISTENT);
            } else {
              logger.error(errorMessages.SESSION.UNEXPECTED, error);
            }
            reject();
          }
        });
    });
  };
}

module.exports = GoogleAuthorizationFinder;
