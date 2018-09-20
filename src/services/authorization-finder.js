const forestServerRequester = require('./forest-server-requester');
const ServerResponseHandler = require('./server-response-handler');
const logger = require('./logger');

function AuthorizationFinder(renderingId, environmentSecret, twoFactorRegistration, email, password, forestToken) {
  this.perform = function () {
    let url = `/liana/v2/renderings/${renderingId}/authorization`;
    let headers = { 'email': email, 'password': password };

    if (!email && !password && forestToken) {
      url = `/liana/v2/renderings/${renderingId}/google-authorization`;
      headers = { 'forest-token': forestToken };
    }

    if (twoFactorRegistration) {
      url += `?two-factor-registration=${twoFactorRegistration}`;
    }

    return forestServerRequester
      .perform(url, environmentSecret, null, headers)
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
