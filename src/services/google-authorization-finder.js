const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const ServerResponseHandler = require('./server-response-handler');
const logger = require('./logger');

function GoogleAuthorizationFinder(renderingId, forestToken, envSecret, isRegistration) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      const forestUrl = new ServiceUrlGetter().perform();

      request
        .get(`${forestUrl}/forest/renderings/${renderingId}/google-authorization?registration=${isRegistration}`)
        .set('forest-secret-key', envSecret)
        .set('forest-token', forestToken)
        .end(function (error, result) {
          new ServerResponseHandler(error, result)
            .perform()
            .then((data) => resolve(data.attributes))
            .catch(() => {
              logger.error(error);
              reject(new Error());
            });
        });
    });
  };
}

module.exports = GoogleAuthorizationFinder;
