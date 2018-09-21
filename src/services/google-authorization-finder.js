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
      .then(result => handleResponse(null, result))
      .catch(error => handleResponse(error));
  };

  function handleResponse(error, result) {
    return new ServerResponseHandler(error, result)
      .perform()
      .then((data) => data.attributes)
      .catch(() => {
        logger.error(error);
        throw new Error();
      });
  }
}

module.exports = GoogleAuthorizationFinder;
