const forestServerRequester = require('./forest-server-requester');
const ServerResponseHandler = require('./server-response-handler');
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
        return new ServerResponseHandler(null, result)
          .perform()
          .then((data) => {
            const user = data.attributes;
            user.id = data.id;
            return user;
          });
      })
      .catch((error) => {
        logger.error(error);
        return new ServerResponseHandler(error)
          .perform()
          .then(() => { throw new Error(); });
      });
  };
}

module.exports = AuthorizationFinder;
