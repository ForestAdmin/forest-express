const forestServerRequester = require('./forest-server-requester');
const logger = require('./logger');
const errorMessages = require('../utils/error-messages');

function AuthorizationFinder(
  renderingId,
  environmentSecret,
  twoFactorRegistration,
  email,
  password,
  forestToken,
) {
  this.perform = () => {
    let pathEnd;
    let headers;

    if (email && password) {
      pathEnd = 'authorization';
      headers = { email, password };
    } else if (forestToken) {
      pathEnd = 'google-authorization';
      headers = { 'forest-token': forestToken };
    }

    let url = `/liana/v2/renderings/${renderingId}/${pathEnd}`;

    if (twoFactorRegistration) {
      url += `?two-factor-registration=${twoFactorRegistration}`;
    }

    return forestServerRequester
      .perform(url, environmentSecret, null, headers)
      .then((result) => {
        const user = result.data.attributes;
        user.id = result.data.id;
        return user;
      })
      .catch((error) => {
        logger.error('Authorization error: ', error);
        let errorMessageToForward;
        switch (error.message) {
          case errorMessages.SERVER_TRANSACTION.SECRET_AND_RENDERINGID_INCONSISTENT:
            errorMessageToForward = error.message;
            break;
          case errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND:
            errorMessageToForward = 'Cannot retrieve the project you\'re trying to unlock. '
              + 'Please check that you\'re using the right environment secret regarding your project and environment.';
            break;
          default: errorMessageToForward = undefined;
        }
        throw new Error(errorMessageToForward);
      });
  };
}

module.exports = AuthorizationFinder;
