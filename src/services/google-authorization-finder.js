const forestServerRequester = require('./forest-server-requester');
const logger = require('./logger');

function GoogleAuthorizationFinder(renderingId, forestToken, environmentSecret, twoFactorRegistration) {
  this.perform = function () {
    let url = `/liana/v2/renderings/${renderingId}/google-authorization`;

    if (twoFactorRegistration) {
      url += `?two-factor-registration=${twoFactorRegistration}`;
    }

    return forestServerRequester
      .perform(url, environmentSecret, null, { 'forest-token': forestToken })
      .then(result => result.data.attributes)
      .catch((error) => {
        logger.error(error);
        throw new Error();
      });
  };
}

module.exports = GoogleAuthorizationFinder;
