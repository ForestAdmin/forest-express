const forestServerRequester = require('./forest-server-requester');
const logger = require('./logger');

function AuthorizationFinder(renderingId, email, password, environmentSecret, twoFactorRegistration) {
  this.perform = function () {
    let url = `/liana/v2/renderings/${renderingId}/authorization`;

    if (twoFactorRegistration) {
      url += `?two-factor-registration=${twoFactorRegistration}`;
    }

    return forestServerRequester
      .perform(url, environmentSecret, null, { email, password })
      .then((result) => {
        const user = result.data.attributes;
        user.id = result.data.id;
        return user;
      })
      .catch((error) => {
        logger.error(error);
        throw new Error();
      });
  };
}

module.exports = AuthorizationFinder;
