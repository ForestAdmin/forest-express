const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const ServerResponseHandler = require('./server-response-handler');
const logger = require('./logger');

function GoogleAuthorizationFinder(renderingId, forestToken, environmentSecret, twoFactorRegistration) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      const forestUrl = new ServiceUrlGetter().perform();
      let url = `${forestUrl}/liana/v2/renderings/${renderingId}/google-authorization`;

      if (twoFactorRegistration) {
        url += `?two-factor-registration=${twoFactorRegistration}`;
      }

      request
        .get(url)
        .set('forest-secret-key', environmentSecret)
        .set('forest-token', forestToken)
        .end(function (error, result) {
          new ServerResponseHandler(error, result)
            .perform()
            .then((data) => {
              const user = data.attributes;
              user.id = data.id;
              resolve(user);
            })
            .catch(() => {
              logger.error(error);
              reject(new Error());
            });
        });
    });
  };
}

module.exports = GoogleAuthorizationFinder;
