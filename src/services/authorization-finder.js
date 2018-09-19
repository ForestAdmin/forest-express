const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const ServerResponseHandler = require('./server-response-handler');
const logger = require('./logger');

function AuthorizationFinder(renderingId, envSecret, twoFactorRegistration, email, password, forestToken) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      const forestUrl = new ServiceUrlGetter().perform();

      let url = `${forestUrl}/liana/v2/renderings/${renderingId}/authorization`;
      let headers = { 'email': email, 'password': password };

      if (!email && !password && forestToken) {
        url = `${forestUrl}/liana/v2/renderings/${renderingId}/google-authorization`;
        headers = { 'forest-token': forestToken };
      }

      if (twoFactorRegistration) {
        url += `?two-factor-registration=${twoFactorRegistration}`;
      }

      request
        .get(url)
        .set('forest-secret-key', envSecret)
        .set(headers)
        .end((error, result) => {
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

module.exports = AuthorizationFinder;
