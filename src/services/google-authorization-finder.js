const P = require('bluebird');
const request = require('superagent');
const logger = require('./logger');
const ServiceUrlGetter = require('./service-url-getter');
const errorMessages = require('../utils/error-messages');

function GoogleAuthorizationFinder(renderingId, forestToken, envSecret) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      const forestUrl = new ServiceUrlGetter().perform();

      request
        .get(forestUrl + '/forest/renderings/' + renderingId + '/google-authorization')
        .set('forest-secret-key', envSecret)
        .set('forest-token', forestToken)
        .end(function (error, result) {
          if (result.status === 200 && result.body && result.body.data && result.body.data.attributes) {
            resolve(result.body.data.attributes);
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
