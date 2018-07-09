const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const ServerResponseHandler = require('./server-response-handler');

function AuthorizationFinder(renderingId, email, password, envSecret) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      const forestUrl = new ServiceUrlGetter().perform();

      request
        .get(`${forestUrl}/liana/v1/renderings/${renderingId}/authorization`)
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
            .catch(() => reject(new Error()));
        });
    });
  };
}

module.exports = AuthorizationFinder;
