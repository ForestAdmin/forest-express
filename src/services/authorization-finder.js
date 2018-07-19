const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const ServerResponseHandler = require('./server-response-handler');
const logger = require('./logger');

function AuthorizationFinder(renderingId, email, password, envSecret, isRegistration) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      const forestUrl = new ServiceUrlGetter().perform();

      request
        .get(`${forestUrl}/liana/v1/renderings/${renderingId}/authorization?registration=${isRegistration}`)
        .set('forest-secret-key', envSecret)
        .set('email', email)
        .set('password', password)
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
