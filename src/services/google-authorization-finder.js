const forestServerRequester = require('./forest-server-requester');
const ServerResponseHandler = require('./server-response-handler');
const logger = require('./logger');

function GoogleAuthorizationFinder(renderingId, forestToken, environmentSecret, twoFactorRegistration) {
  this.perform = function () {
    let url = `/liana/v2/renderings/${renderingId}/google-authorization`;

    if (twoFactorRegistration) {
      url += `?two-factor-registration=${twoFactorRegistration}`;
    }

    return forestServerRequester
      .perform(url, environmentSecret, null, { 'forest-token': forestToken })
      .then((result) => {
        return new ServerResponseHandler(null, result)
          .perform()
          .then((data) => data.attributes);
      })
      .catch((error) => {
        logger.error(error);
        return new ServerResponseHandler(error)
          .perform()
          .then(() => { throw new Error(); });
      });
  };
}

module.exports = GoogleAuthorizationFinder;
