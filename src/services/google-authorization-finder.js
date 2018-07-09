const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const ServerResponseHandler = require('./server-response-handler');

function GoogleAuthorizationFinder(renderingId, forestToken, envSecret) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      const forestUrl = new ServiceUrlGetter().perform();

      request
        .get(forestUrl + '/forest/renderings/' + renderingId + '/google-authorization')
        .set('forest-secret-key', envSecret)
        .set('forest-token', forestToken)
        .end(function (error, result) {
          new ServerResponseHandler(error, result)
            .perform()
            .then((data) => resolve(data.attributes))
            .catch(() => reject(new Error()));
        });
    });
  };
}

module.exports = GoogleAuthorizationFinder;
